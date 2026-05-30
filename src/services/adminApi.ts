import { request } from '@/services/apiClient'
import type {
  CoverageTasksResponse,
  CoverageWorkflow,
  CoverageWorkflowsResponse,
  DataCoveragePanel,
  DataCoveragePanelKey,
  DataCoverageRequest,
  EnqueueCoverageRequest,
  EnqueueWorkflowRequest,
  WorkerStatus,
} from '@/types/adminCoverage'

export const adminApi = {
  loadCoveragePanel(panelKey: DataCoveragePanelKey, payload: DataCoverageRequest): Promise<DataCoveragePanel> {
    return request<DataCoveragePanel>(`/admin/data-coverage/panels/${panelKey}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  workerStatus(): Promise<WorkerStatus> {
    return request<WorkerStatus>('/admin/data-coverage/worker-status')
  },

  enqueuePanel(panelKey: DataCoveragePanelKey, payload: EnqueueCoverageRequest): Promise<{ enqueued: number }> {
    return request<{ enqueued: number }>(`/admin/data-coverage/panels/${panelKey}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  tasks(): Promise<CoverageTasksResponse> {
    return request<CoverageTasksResponse>('/admin/data-coverage/tasks')
  },

  enqueueWorkflow(payload: EnqueueWorkflowRequest): Promise<CoverageWorkflow> {
    return request<CoverageWorkflow>('/admin/data-coverage/workflows', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  workflows(): Promise<CoverageWorkflowsResponse> {
    return request<CoverageWorkflowsResponse>('/admin/data-coverage/workflows')
  },
}
