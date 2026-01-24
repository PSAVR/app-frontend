(async function(){
  const API_BASE = '';

  const ALLOWED_PATHS = [
    '/pages/onboarding-intro.html',
    '/pages/onboarding-instrucciones.html',
    '/pages/evaluacion-inicial.html'
  ];

  function currentPath(){ return location.pathname; }
  function hasOnboardingParam(){
    return new URLSearchParams(location.search).get('onboarding') === '1';
  }

  async function getUser() {
    try {
      const r = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  }

  const user_ = await getUser();

  if (!user_) return;

  const noTieneNivel = !user_.current_level_id;

  if (noTieneNivel) {
    const path = currentPath();
    const isAllowed = ALLOWED_PATHS.includes(path);
    const isEvalWithFlag = path === '/pages/evaluacion-inicial.html' && hasOnboardingParam();

    if (!(isAllowed || isEvalWithFlag)) {
      location.href = '/pages/onboarding-intro.html?onboarding=1';
    }
  }
})();
