import { apiClient } from './client';
import type { ModerationReportReason, ModerationReportTargetType } from '../constants/moderationReport';

export const moderationApi = {
  createReport: (body: {
    targetType: ModerationReportTargetType;
    targetId: string;
    reason: ModerationReportReason;
    details?: string;
    contextUrl?: string;
  }) => apiClient.post<{ data: { id: string; status: string } }>('/moderation/reports', body),
};
