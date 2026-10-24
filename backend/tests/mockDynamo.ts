import { Complaint, InAppNotification } from '../src/types.js';
import { IDynamoDocClient } from '../src/db.js';

export class InMemoryDynamoClient implements IDynamoDocClient {
  public items: Map<string, Complaint | InAppNotification | any> = new Map();

  async send(command: any): Promise<any> {
    const name = command.constructor?.name || '';

    if (name === 'PutCommand' || command.input?.Item) {
      const item = command.input.Item;
      const id = item.complaintId;
      if (command.input?.ConditionExpression && this.items.has(id)) {
        const err: any = new Error('ConditionalCheckFailedException');
        err.name = 'ConditionalCheckFailedException';
        throw err;
      }
      this.items.set(id, { ...item });
      return {};
    }

    if (name === 'GetCommand' || (command.input?.Key && !command.input.UpdateExpression && name !== 'DeleteCommand')) {
      const id = command.input.Key.complaintId;
      const found = this.items.get(id);
      return { Item: found ? { ...found } : undefined };
    }

    if (name === 'DeleteCommand') {
      const id = command.input.Key.complaintId;
      this.items.delete(id);
      return {};
    }

    if (name === 'QueryCommand' || command.input?.KeyConditionExpression) {
      const indexName = command.input.IndexName;
      const all = Array.from(this.items.values());

      if (indexName === 'GSI_StudentQueue') {
        const studentId = command.input.ExpressionAttributeValues[':studentId'] || command.input.ExpressionAttributeValues[':recipientId'];
        const attrValues = command.input.ExpressionAttributeValues || {};
        let matched = all
          .filter(c => (c.studentId === studentId || c.recipientUserId === studentId))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (attrValues[':entityType']) {
          matched = matched.filter(c => c.entityType === attrValues[':entityType']);
        }
        if (command.input?.FilterExpression?.includes('isDismissed')) {
          matched = matched.filter(c => !c.isDismissed);
        }
        if (command.input?.FilterExpression?.includes('isRead')) {
          matched = matched.filter(c => !c.isRead);
        }

        const limit = command.input.Limit || matched.length;
        const exclusiveStartKey = command.input.ExclusiveStartKey;

        let startIndex = 0;
        if (exclusiveStartKey?.complaintId) {
          const foundIdx = matched.findIndex(c => c.complaintId === exclusiveStartKey.complaintId);
          if (foundIdx !== -1) {
            startIndex = foundIdx + 1;
          }
        }

        const sliced = matched.slice(startIndex, startIndex + limit);
        const hasMore = startIndex + limit < matched.length;
        const lastItem = sliced[sliced.length - 1];

        return {
          Items: sliced,
          LastEvaluatedKey: hasMore && lastItem ? {
            studentId,
            createdAt: lastItem.createdAt,
            complaintId: lastItem.complaintId
          } : undefined
        };
      }

      if (indexName === 'GSI_AdminQueue') {
        let matched = all.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const attrValues = command.input.ExpressionAttributeValues || {};

        if (attrValues[':status']) {
          matched = matched.filter(c => c.status === attrValues[':status']);
        }
        if (attrValues[':priority']) {
          matched = matched.filter(c => c.priority === attrValues[':priority']);
        }
        if (attrValues[':category']) {
          matched = matched.filter(c => c.category === attrValues[':category']);
        }
        if (attrValues[':department']) {
          matched = matched.filter(c => c.department === attrValues[':department']);
        }
        if (attrValues[':entityType']) {
          matched = matched.filter(c => c.entityType === attrValues[':entityType']);
        }

        const limit = command.input.Limit || matched.length;
        const exclusiveStartKey = command.input.ExclusiveStartKey;

        let startIndex = 0;
        if (exclusiveStartKey?.complaintId) {
          const foundIdx = matched.findIndex(c => c.complaintId === exclusiveStartKey.complaintId);
          if (foundIdx !== -1) {
            startIndex = foundIdx + 1;
          }
        }

        const sliced = matched.slice(startIndex, startIndex + limit);
        const hasMore = startIndex + limit < matched.length;
        const lastItem = sliced[sliced.length - 1];

        return {
          Items: sliced,
          LastEvaluatedKey: hasMore && lastItem ? {
            entityType: 'COMPLAINT',
            createdAt: lastItem.createdAt,
            complaintId: lastItem.complaintId
          } : undefined
        };
      }

      return { Items: all };
    }

    if (name === 'UpdateCommand' || command.input?.UpdateExpression) {
      const id = command.input.Key.complaintId;
      const existing = this.items.get(id);
      if (!existing) {
        return { Attributes: undefined };
      }

      const values = command.input.ExpressionAttributeValues || {};
      const updated: any = { ...existing };

      if (values[':newStatus']) updated.status = values[':newStatus'];
      if (values[':status']) updated.status = values[':status'];
      if (values[':now'] && !command.input.UpdateExpression.includes('isRead') && !command.input.UpdateExpression.includes('isDismissed')) {
        updated.updatedAt = values[':now'];
      }
      if (values[':history']) updated.statusHistory = values[':history'];
      if (values[':resolvedAt'] !== undefined) updated.resolvedAt = values[':resolvedAt'];
      if (values[':adminRemarks'] !== undefined) updated.adminRemarks = values[':adminRemarks'];
      if (values[':dept'] !== undefined) updated.department = values[':dept'];
      if (values[':assignee'] !== undefined) updated.assignedTo = values[':assignee'];

      // Notification update attributes
      if (command.input.UpdateExpression.includes('isRead')) {
        updated.isRead = true;
        updated.readAt = values[':now'] || new Date().toISOString();
      }
      if (command.input.UpdateExpression.includes('isDismissed')) {
        updated.isDismissed = true;
        updated.dismissedAt = values[':now'] || new Date().toISOString();
      }

      this.items.set(id, updated);
      return { Attributes: updated };
    }

    return {};
  }
}
