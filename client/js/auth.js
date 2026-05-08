const API_BASE_URL = 'https://shiqingbackend.loca.lt';

console.log('AUTH JS 已載入');

document.addEventListener('DOMContentLoaded', () => {

  const loginForm = document.getElementById('login-form');

  console.log('login-form:', loginForm);

  if (!loginForm) {
    console.error('找不到 login-form');
    return;
  }

  loginForm.addEventListener('submit', async (e) => {

    e.preventDefault();

    console.log('開始送出登入');

    const formData = new FormData(loginForm);

    const payload = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    console.log('登入資料:', payload);

    try {

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('API Response:', res);

      const result = await res.json();

      console.log('API Result:', result);

      if (!res.ok || !result.success) {
        throw new Error(result.message || '登入失敗');
      }

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

      // GitHub Pages 用相對路徑
      window.location.href = './account.html';

    } catch (error) {

      console.error('登入錯誤:', error);

      alert(
        error.message ||
        '連線失敗，請確認後端是否開啟'
      );
    }

  });

});
