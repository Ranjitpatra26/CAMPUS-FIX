import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import {
  Complaint,
  ComplaintFilterOptions,
  ComplaintStatus,
  DepartmentName,
  StatusHistoryEntry,
  AnalyticsRecord,
  InAppNotification
} from './types.js';
import { BackendConfig, config as defaultConfig } from './config.js';
import { NotFoundError, BadRequestError } from './errors.js';

export interface IDynamoDocClient {
  send(command: any): Promise<any>;
}

export class DynamoDBComplaintRepository {
  private docClient: IDynamoDocClient;
  private tableName: string;

  constructor(config: BackendConfig = defaultConfig, customDocClient?: IDynamoDocClient) {
    this.tableName = config.tableName;
    if (customDocClient) {
      this.docClient = customDocClient;
    } else {
      const client = new DynamoDBClient({ region: config.awsRegion });
      this.docClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
          removeUndefinedValues: true
        }
      });
    }
  }

  private encodeToken(key?: Record<string, any>): string | undefined {
    if (!key) return undefined;
    return Buffer.from(JSON.stringify(key)).toString('base64url');
  }

  private decodeToken(token?: string): Record<string, any> | undefined {
    if (!token || token.trim() === '') return undefined;
    try {
      const json = Buffer.from(token, 'base64url').toString('utf8');
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new BadRequestError('Invalid pagination token (nextToken).');
      }
      return parsed;
    } catch (err) {
      if (err instanceof BadRequestError) throw err;
      throw new BadRequestError('Invalid pagination token (nextToken). Malformed token.');
    }
  }

  async createComplaint(complaint: Complaint): Promise<Complaint> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: complaint,
      ConditionExpression: 'attribute_not_exists(complaintId)'
    });

    await this.docClient.send(command);
    return complaint;
  }

  async getComplaintById(complaintId: string): Promise<Complaint | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        complaintId
      }
    });

    const result = await this.docClient.send(command);
    if (!result.Item) return null;
    return result.Item as Complaint;
  }

  async getComplaintsByStudent(
    studentId: string,
    limit: number = 50,
    nextToken?: string
  ): Promise<{ complaints: Complaint[]; nextToken?: string }> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI_StudentQueue',
      KeyConditionExpression: 'studentId = :studentId',
      FilterExpression: '#entityType = :entityType',
      ExpressionAttributeNames: {
        '#entityType': 'entityType'
      },
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':entityType': 'COMPLAINT'
      },
      ScanIndexForward: false, // Newest first
      Limit: Math.min(Math.max(limit, 1), 100),
      ExclusiveStartKey: this.decodeToken(nextToken)
    });

    const result = await this.docClient.send(command);
    const items = (result.Items || []) as Complaint[];

    return {
      complaints: items,
      nextToken: this.encodeToken(result.LastEvaluatedKey)
    };
  }

  async getAllComplaints(
    filters?: ComplaintFilterOptions,
    limit: number = 50,
    nextToken?: string
  ): Promise<{ complaints: Complaint[]; nextToken?: string }> {
    // Queries GSI_AdminQueue using static entityType = 'COMPLAINT'
    const filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {
      ':entityType': 'COMPLAINT'
    };
    const expressionAttributeNames: Record<string, string> = {
      '#entityType': 'entityType'
    };

    if (filters?.status && filters.status !== 'All') {
      filterExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = filters.status;
    }

    if (filters?.priority && filters.priority !== 'All') {
      filterExpressions.push('#priority = :priority');
      expressionAttributeNames['#priority'] = 'priority';
      expressionAttributeValues[':priority'] = filters.priority;
    }

    if (filters?.category && filters.category !== 'All') {
      filterExpressions.push('#category = :category');
      expressionAttributeNames['#category'] = 'category';
      expressionAttributeValues[':category'] = filters.category;
    }

    if (filters?.department && filters.department !== 'All') {
      filterExpressions.push('#department = :department');
      expressionAttributeNames['#department'] = 'department';
      expressionAttributeValues[':department'] = filters.department;
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI_AdminQueue',
      KeyConditionExpression: '#entityType = :entityType',
      FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: false, // Newest first
      Limit: Math.min(Math.max(limit, 1), 100),
      ExclusiveStartKey: this.decodeToken(nextToken)
    });

    const result = await this.docClient.send(command);
    const items = (result.Items || []) as Complaint[];

    return {
      complaints: items,
      nextToken: this.encodeToken(result.LastEvaluatedKey)
    };
  }

  async getAnalyticsRecords(
    limit: number = 100,
    nextToken?: string,
    filters?: ComplaintFilterOptions
  ): Promise<{ items: AnalyticsRecord[]; nextToken?: string }> {
    const filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {
      ':entityType': 'COMPLAINT'
    };
    const expressionAttributeNames: Record<string, string> = {
      '#entityType': 'entityType',
      '#complaintId': 'complaintId',
      '#title': 'title',
      '#status': 'status',
      '#department': 'department',
      '#category': 'category',
      '#priority': 'priority',
      '#createdAt': 'createdAt',
      '#resolvedAt': 'resolvedAt',
      '#assignedTo': 'assignedTo',
      '#statusHistory': 'statusHistory'
    };

    if (filters?.status && filters.status !== 'All') {
      filterExpressions.push('#status = :status');
      expressionAttributeValues[':status'] = filters.status;
    }

    if (filters?.priority && filters.priority !== 'All') {
      filterExpressions.push('#priority = :priority');
      expressionAttributeValues[':priority'] = filters.priority;
    }

    if (filters?.category && filters.category !== 'All') {
      filterExpressions.push('#category = :category');
      expressionAttributeValues[':category'] = filters.category;
    }

    if (filters?.department && filters.department !== 'All') {
      filterExpressions.push('#department = :department');
      expressionAttributeValues[':department'] = filters.department;
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI_AdminQueue',
      KeyConditionExpression: '#entityType = :entityType',
      FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
      ProjectionExpression:
        '#complaintId, #title, #status, #department, #category, #priority, #createdAt, #resolvedAt, #assignedTo, #statusHistory',
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: false, // Newest first
      Limit: Math.min(Math.max(limit, 1), 100),
      ExclusiveStartKey: this.decodeToken(nextToken)
    });

    const result = await this.docClient.send(command);
    const rawItems = (result.Items || []) as any[];

    // Strip student personal identifiers and format strictly as AnalyticsRecord
    const projected: AnalyticsRecord[] = rawItems.map(item => ({
      complaintId: item.complaintId,
      title: item.title,
      status: item.status,
      department: item.department || undefined,
      category: item.category,
      priority: item.priority,
      createdAt: item.createdAt,
      resolvedAt: item.resolvedAt || null,
      assignedTo: item.assignedTo || undefined,
      statusHistory: Array.isArray(item.statusHistory)
        ? item.statusHistory.map((h: any) => ({
            newStatus: h.newStatus,
            timestamp: h.timestamp
          }))
        : []
    }));

    return {
      items: projected,
      nextToken: this.encodeToken(result.LastEvaluatedKey)
    };
  }

  async updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    historyEntry: StatusHistoryEntry,
    remark?: string
  ): Promise<Complaint> {
    const existing = await this.getComplaintById(complaintId);
    if (!existing) {
      throw new NotFoundError(`Complaint "${complaintId}" does not exist.`);
    }

    const now = new Date().toISOString();
    const updatedHistory = [...(existing.statusHistory || []), historyEntry];
    const resolvedAt = newStatus === 'Resolved' ? now : existing.resolvedAt || null;
    const adminRemarks = remark?.trim() || existing.adminRemarks;

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { complaintId },
      UpdateExpression:
        'SET #status = :newStatus, #updatedAt = :now, #history = :history, #resolvedAt = :resolvedAt, #adminRemarks = :adminRemarks',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
        '#history': 'statusHistory',
        '#resolvedAt': 'resolvedAt',
        '#adminRemarks': 'adminRemarks'
      },
      ExpressionAttributeValues: {
        ':newStatus': newStatus,
        ':now': now,
        ':history': updatedHistory,
        ':resolvedAt': resolvedAt,
        ':adminRemarks': adminRemarks
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await this.docClient.send(command);
    return result.Attributes as Complaint;
  }

  async assignComplaint(
    complaintId: string,
    department: DepartmentName,
    assignedTo: string,
    historyEntry?: StatusHistoryEntry
  ): Promise<Complaint> {
    const existing = await this.getComplaintById(complaintId);
    if (!existing) {
      throw new NotFoundError(`Complaint "${complaintId}" does not exist.`);
    }

    const now = new Date().toISOString();
    const updatedHistory = historyEntry
      ? [...(existing.statusHistory || []), historyEntry]
      : existing.statusHistory;

    // Transition from Submitted to Assigned if applicable
    const nextStatus: ComplaintStatus =
      existing.status === 'Submitted' ? 'Assigned' : existing.status;

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { complaintId },
      UpdateExpression:
        'SET #dept = :dept, #assignee = :assignee, #status = :status, #updatedAt = :now, #history = :history',
      ExpressionAttributeNames: {
        '#dept': 'department',
        '#assignee': 'assignedTo',
        '#status': 'status',
        '#updatedAt': 'updatedAt',
        '#history': 'statusHistory'
      },
      ExpressionAttributeValues: {
        ':dept': department,
        ':assignee': assignedTo,
        ':status': nextStatus,
        ':now': now,
        ':history': updatedHistory
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await this.docClient.send(command);
    return result.Attributes as Complaint;
  }

  async createNotification(notification: InAppNotification): Promise<InAppNotification> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: notification,
      ConditionExpression: 'attribute_not_exists(complaintId)'
    });

    try {
      await this.docClient.send(command);
      return notification;
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        const existing = await this.getNotificationById(notification.notificationId);
        if (existing) return existing;
      }
      throw err;
    }
  }

  async getNotificationById(notificationId: string): Promise<InAppNotification | null> {
    const complaintId = notificationId.startsWith('NOTIF#')
      ? notificationId
      : `NOTIF#${notificationId}`;

    const command = new GetCommand({
      TableName: this.tableName,
      Key: { complaintId }
    });

    const result = await this.docClient.send(command);
    if (!result.Item) return null;
    return result.Item as InAppNotification;
  }

  async getNotificationsByRecipient(
    recipientId: string,
    options?: {
      limit?: number;
      nextToken?: string;
      unreadOnly?: boolean;
      includeDismissed?: boolean;
    }
  ): Promise<{ notifications: InAppNotification[]; unreadCount: number; nextToken?: string }> {
    const filterExpressions: string[] = ['#entityType = :entityType'];
    const expressionAttributeNames: Record<string, string> = {
      '#entityType': 'entityType'
    };
    const expressionAttributeValues: Record<string, any> = {
      ':recipientId': recipientId,
      ':entityType': 'NOTIFICATION'
    };

    if (!options?.includeDismissed) {
      filterExpressions.push('(#isDismissed = :false OR attribute_not_exists(#isDismissed))');
      expressionAttributeNames['#isDismissed'] = 'isDismissed';
      expressionAttributeValues[':false'] = false;
    }

    if (options?.unreadOnly) {
      filterExpressions.push('(#isRead = :false OR attribute_not_exists(#isRead))');
      expressionAttributeNames['#isRead'] = 'isRead';
      expressionAttributeValues[':false'] = false;
    }

    const limit = Math.min(Math.max(options?.limit || 50, 1), 100);

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI_StudentQueue',
      KeyConditionExpression: 'studentId = :recipientId',
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: false, // Newest first
      Limit: limit,
      ExclusiveStartKey: this.decodeToken(options?.nextToken)
    });

    const result = await this.docClient.send(command);
    const items = (result.Items || []) as InAppNotification[];

    const unreadCount = items.filter(n => !n.isRead && !n.isDismissed).length;

    return {
      notifications: items,
      unreadCount,
      nextToken: this.encodeToken(result.LastEvaluatedKey)
    };
  }

  async markNotificationAsRead(notificationId: string): Promise<InAppNotification> {
    const complaintId = notificationId.startsWith('NOTIF#')
      ? notificationId
      : `NOTIF#${notificationId}`;

    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { complaintId },
      UpdateExpression: 'SET #isRead = :true, #readAt = :now',
      ExpressionAttributeNames: {
        '#isRead': 'isRead',
        '#readAt': 'readAt'
      },
      ExpressionAttributeValues: {
        ':true': true,
        ':now': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await this.docClient.send(command);
    if (!result.Attributes) {
      throw new NotFoundError(`Notification "${notificationId}" does not exist.`);
    }
    return result.Attributes as InAppNotification;
  }

  async markAllNotificationsAsRead(recipientId: string): Promise<number> {
    const { notifications } = await this.getNotificationsByRecipient(recipientId, {
      unreadOnly: true,
      limit: 100
    });

    let updatedCount = 0;
    for (const n of notifications) {
      if (!n.isRead) {
        await this.markNotificationAsRead(n.notificationId);
        updatedCount++;
      }
    }
    return updatedCount;
  }

  async dismissNotification(notificationId: string): Promise<InAppNotification> {
    const complaintId = notificationId.startsWith('NOTIF#')
      ? notificationId
      : `NOTIF#${notificationId}`;

    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { complaintId },
      UpdateExpression: 'SET #isDismissed = :true, #dismissedAt = :now, #isRead = :true',
      ExpressionAttributeNames: {
        '#isDismissed': 'isDismissed',
        '#dismissedAt': 'dismissedAt',
        '#isRead': 'isRead'
      },
      ExpressionAttributeValues: {
        ':true': true,
        ':now': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await this.docClient.send(command);
    if (!result.Attributes) {
      throw new NotFoundError(`Notification "${notificationId}" does not exist.`);
    }
    return result.Attributes as InAppNotification;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const complaintId = notificationId.startsWith('NOTIF#')
      ? notificationId
      : `NOTIF#${notificationId}`;

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { complaintId }
    });

    await this.docClient.send(command);
  }

  async getUnreadNotificationCount(recipientId: string): Promise<number> {
    const res = await this.getNotificationsByRecipient(recipientId, {
      unreadOnly: true,
      limit: 100
    });
    return res.notifications.length;
  }
}

export const defaultComplaintRepo = new DynamoDBComplaintRepository();
