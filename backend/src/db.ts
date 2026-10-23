import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import {
  Complaint,
  ComplaintFilterOptions,
  ComplaintStatus,
  DepartmentName,
  StatusHistoryEntry
} from './types.js';
import { BackendConfig, config as defaultConfig } from './config.js';
import { NotFoundError } from './errors.js';

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
    if (!token) return undefined;
    try {
      const json = Buffer.from(token, 'base64url').toString('utf8');
      return JSON.parse(json);
    } catch {
      return undefined;
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
      ExpressionAttributeValues: {
        ':studentId': studentId
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
}

export const defaultComplaintRepo = new DynamoDBComplaintRepository();
