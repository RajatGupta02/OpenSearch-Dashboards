/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { getServices } from './opensearch_dashboards_services';

const sampleDataUrl = '/api/sample_data';

function clearIndexPatternsCache() {
  getServices().indexPatternService.clearCache();
}

export async function listSampleDataSets(dataSourceId) {
  const query = buildQuery(dataSourceId);
  return await getServices().http.get(sampleDataUrl, { query });
}

const canUpdateUISetting = () => {
  const {
    application: { capabilities },
    workspaces,
  } = getServices();
  if (
    capabilities.workspaces &&
    capabilities.workspaces.enabled &&
    capabilities.workspaces.permissionEnabled
  ) {
    return !!workspaces?.currentWorkspace$.getValue()?.owner;
  }
  return true;
};

export async function installSampleDataSet(id, sampleDataDefaultIndex, dataSourceId) {
  const query = buildQuery(dataSourceId);
  await getServices().http.post(`${sampleDataUrl}/${id}`, { query });

  if (canUpdateUISetting() && getServices().uiSettings.isDefault('defaultIndex')) {
    getServices().uiSettings.set('defaultIndex', sampleDataDefaultIndex);
  }

  clearIndexPatternsCache();
}

export async function uninstallSampleDataSet(id, sampleDataDefaultIndex, dataSourceId) {
  const query = buildQuery(dataSourceId);
  await getServices().http.delete(`${sampleDataUrl}/${id}`, { query });

  const uiSettings = getServices().uiSettings;

  if (
    canUpdateUISetting() &&
    !uiSettings.isDefault('defaultIndex') &&
    uiSettings.get('defaultIndex') === sampleDataDefaultIndex
  ) {
    uiSettings.set('defaultIndex', null);
  }

  clearIndexPatternsCache();
}

function buildQuery(dataSourceId) {
  const query = {};

  if (dataSourceId) {
    query.data_source_id = dataSourceId;
  }

  return query;
}
