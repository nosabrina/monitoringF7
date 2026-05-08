/* Monitoring F7 v58 — façade API préparatoire, inactive par défaut. */
(function(){
  'use strict';

  function getConfig(){
    return window.MonitoringBackendConfig?.current || { backendEnabled:false, apiBaseUrl:'', syncEnabled:false, authMode:'local', storageMode:'local', auditMode:'local' };
  }

  function isBackendEnabled(){
    const cfg = getConfig();
    return cfg.backendEnabled === true && !!cfg.apiBaseUrl;
  }

  function getBackendStatus(){
    const status = window.MonitoringBackendConfig?.getStatus ? window.MonitoringBackendConfig.getStatus() : getConfig();
    return Object.freeze(Object.assign({}, status, {
      statusLabel: isBackendEnabled() ? 'backend préparé' : 'local uniquement',
      lastCheckedAt: new Date().toISOString()
    }));
  }

  function disabledResponse(method, path){
    return Promise.resolve(Object.freeze({
      ok: false,
      status: 0,
      disabled: true,
      localMode: true,
      method,
      path: String(path || ''),
      message: 'Backend désactivé en v58 : aucune requête distante effectuée.'
    }));
  }

  async function request(method, path, body, options){
    if(!isBackendEnabled()) return disabledResponse(method, path);
    const cfg = getConfig();
    const endpoint = `${cfg.apiBaseUrl}/${String(path || '').replace(/^\/+/, '')}`;
    const fetchOptions = Object.assign({
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    }, options || {});
    if(body !== undefined && body !== null) fetchOptions.body = JSON.stringify(body);
    try{
      const response = await fetch(endpoint, fetchOptions);
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await response.json() : await response.text();
      return { ok: response.ok, status: response.status, data: payload };
    }catch(error){
      return { ok:false, status:0, error:String(error?.message || error), message:'Erreur API distante non bloquante.' };
    }
  }

  window.MonitoringApiClient = Object.freeze({
    apiGet(path, options){ return request('GET', path, null, options); },
    apiPost(path, body, options){ return request('POST', path, body, options); },
    apiPut(path, body, options){ return request('PUT', path, body, options); },
    apiDelete(path, options){ return request('DELETE', path, null, options); },
    isBackendEnabled,
    getBackendStatus
  });
})();
