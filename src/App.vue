<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>图片编辑库演示</h1>
      </div>
      <div class="nav-links">
        <router-link to="/">首页</router-link>
        <router-link to="/tui-editor">TUI Image Editor</router-link>
        <router-link to="/fabric-editor">Fabric.js</router-link>
        <router-link to="/cropper-editor">Cropper.js</router-link>
        <router-link to="/jimp-editor">Jimp</router-link>
        <router-link to="/konva-editor">Konva.js</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view/>
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-brand h1 {
  margin-bottom: 1rem;
  font-size: 1.8rem;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-weight: 500;
  border: 2px solid transparent;
}

.nav-links a:hover {
  background-color: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.3);
}

.nav-links a.router-link-exact-active {
  background-color: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.5);
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
  }

  .nav-brand h1 {
    font-size: 1.5rem;
  }

  .nav-links {
    gap: 1rem;
  }

  .nav-links a {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
