document.addEventListener('DOMContentLoaded', function () {
    // 创建按钮和模态框的HTML
    const buttonHTML = '<button id="showCodeBtn">显示代码</button>';
    const modalHTML = `
    <div id="codeModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000; background:white; padding:20px; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">
      <pre id="codeBlock" style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word;"></pre>
      <button onclick="closeCodeModal()">关闭</button>
    </div>`;

    // 插入到 body 里
    document.body.insertAdjacentHTML('beforeend', buttonHTML + modalHTML);

    // 添加事件监听
    document.getElementById('showCodeBtn').addEventListener('click', function() {
        const codeContent = `
<script>
  window.difyChatbotConfig = {
    token: '64lEa1Y7P265oFLl'
  }
</script>
<script src="https://udify.app/embed.min.js" id="64lEa1Y7P265oFLl" defer></script>
        `;
        document.getElementById('codeBlock').textContent = codeContent;
        document.getElementById('codeModal').style.display = 'block';
    });

    window.closeCodeModal = function() {
        document.getElementById('codeModal').style.display = 'none';
    };
});