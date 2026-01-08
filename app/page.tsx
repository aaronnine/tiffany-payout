export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1 style={{ color: 'green', fontSize: '24px' }}>✅ 终于成功了！网站已上线</h1>
      <p>如果看到这句话，说明 404 彻底解决了。</p>
      <a
        href="/login"
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'black',
          color: 'white',
          textDecoration: 'none',
        }}
      >
        👉 点击这里去登录/注册
      </a>
    </div>
  );
}

