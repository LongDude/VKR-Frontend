import { request } from '@/services/apiClient'
import type { DataCoveragePanel, DataCoveragePanelKey, DataCoverageRequest } from '@/types/adminCoverage'

export const adminApi = {
  loadCoveragePanel(panelKey: DataCoveragePanelKey, payload: DataCoverageRequest): Promise<DataCoveragePanel> {
    return request<DataCoveragePanel>(`/admin/data-coverage/panels/${panelKey}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
