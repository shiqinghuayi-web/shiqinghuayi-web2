// 這裡填入你 B 電腦 VM 的 IP 位址
// 如果連手機熱點，請確認這是在同一個網段內的 IP
const API_BASE_URL = 'https://shiqingbackend.loca.lt'; 

document.getElementById('login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const payload = {
    email: formData.get('email'),
    password: formData.get('password')
  };

  try {
    // 關鍵修改：加上完整的 B 電腦 IP 網址
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    
    if (!res.ok || !result.success) {
      throw new Error(result.message || '登入失敗');
    }

    // 根據你後端傳回的結構調整 (之前建議的後端是回傳 result.data.token)
    const token = result.token || (result.data && result.data.token);
    if (token) {
      localStorage.setItem('token', token);
      alert('登入成功');
      window.location.href = '/account.html';
    } else {
      throw new Error('伺服器未回傳驗證碼');
    }

  } catch (error) {
    alert(error.message || '連線失敗，請檢查 B 電腦伺服器是否開啟');
    console.error('Login Error:', error);
  }
});
