const API_BASE_URL = 'https://shiqingbackend.loca.lt';

document.getElementById('login-form')?.addEventListener('submit', async e => {

  e.preventDefault();

  const formData = new FormData(e.currentTarget);

  const payload = {
    email: formData.get('email'),
    password: formData.get('password')
  };

  try {

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || '登入失敗');
    }

    // 後端 token
    const token = result?.data?.token;

    if (!token) {
      throw new Error('未取得 Token');
    }

    // 儲存 token
    localStorage.setItem('token', token);

    // 儲存 user
    localStorage.setItem(
      'user',
      JSON.stringify(result.data.user)
    );

    alert('登入成功');

    // GitHub Pages 路徑修正
    window.location.href = './account.html';

  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      '連線失敗，請確認後端是否開啟'
    );
  }
});
