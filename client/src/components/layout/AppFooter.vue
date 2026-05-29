<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-section">
        <div class="footer-logo">
          <span>🐾 宠伴</span>
        </div>
        <p class="footer-description">让每一只宠物都能找到属于它的家</p>
      </div>

      <div class="footer-links">
        <div class="link-group">
          <h4>功能导航</h4>
          <a href="/">首页</a>
          <a href="/community">社区</a>
          <a href="/adoption">领养</a>
          <a href="/services">服务</a>
        </div>
        <div class="link-group">
          <h4>帮助中心</h4>
          <a href="#">常见问题</a>
          <a href="#">用户协议</a>
          <a href="#">隐私政策</a>
          <a href="#">联系我们</a>
        </div>
        <div class="link-group">
          <h4>关注我们</h4>
          <a href="#">微信公众号</a>
          <a href="#">微博</a>
          <a href="#">小红书</a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>© 2024 宠伴. All rights reserved.</p>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.app-footer {
  background: #1a1a2e;
  color: #b5b5c7;
  padding: 48px 0 24px;
  margin-top: 60px;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  gap: 60px;
}

.footer-section {
  flex: 1;
}

.footer-logo {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}

.footer-description {
  color: #8b8b9c;
  font-size: 14px;
  line-height: 1.6;
}

.footer-links {
  flex: 2;
  display: flex;
  gap: 80px;
}

.link-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-group h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.link-group a {
  color: #8b8b9c;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.link-group a:hover {
  color: #10B981;
}

.footer-bottom {
  max-width: 1400px;
  margin: 40px auto 0;
  padding: 24px 20px 0;
  border-top: 1px solid #2d2d44;
  text-align: center;
}

.footer-bottom p {
  font-size: 13px;
  color: #6b6b80;
}
</style>
