import { Complaint } from '../src/types.js';
import { IDynamoDocClient } from '../src/db.js';

export class InMemoryDynamoClient implements IDynamoDocClient {
  public items: Map<string, Complaint> = new Map();

  async send(command: any): Promise<any> {
    const name = command.constructor?.name || '';

    if (name === 'PutCommand' || command.input?.Item) {
      const item = command.input.Item as Complaint;
      this.items.set(item.complaintId, { ...item });
      return {};
    }

    if (name === 'GetCommand' || (command.input?.Key && !command.input.UpdateExpression)) {
      const id = command.input.Key.complaintId;
      const found = this.items.get(id);
      return { Item: found ? { ...found } : undefined };
    }

    if (name === 'QueryCommand' || command.input?.KeyConditionExpression) {
      const indexName = command.input.IndexName;
      const all = Array.from(this.items.values());

      if (indexName === 'GSI_StudentQueue') {
        const studentId = command.input.ExpressionAttributeValues[':studentId'];
        let matched = all
          .filter(c => c.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

      const values = command.input.ExpressionAttributeValues;
      const updated: Complaint = { ...existing };

      if (values[':newStatus']) updated.status = values[':newStatus'];
      if (values[':status']) updated.status = values[':status'];
      if (values[':now']) updated.updatedAt = values[':now'];
      if (values[':history']) updated.statusHistory = values[':history'];
      if (values[':resolvedAt'] !== undefined) updated.resolvedAt = values[':resolvedAt'];
      if (values[':adminRemarks'] !== undefined) updated.adminRemarks = values[':adminRemarks'];
      if (values[':dept'] !== undefined) updated.department = values[':dept'];
      if (values[':assignee'] !== undefined) updated.assignedTo = values[':assignee'];

      this.items.set(id, updated);
      return { Attributes: updated };
    }

    return {};
  }
}
