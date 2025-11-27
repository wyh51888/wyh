// 👇 1. 初始化 (记得填回你自己的 URL 和 Key)
const supabaseUrl = 'https://uyvixbgmynvrfbfiewak.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dml4YmdteW52cmZiZmlld2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDg5NjcsImV4cCI6MjA3OTc4NDk2N30.vWD3rypscoap9mETCCD7hcEv6Fa8MCzGDEI42L7O3yg'; 

console.log("🚀 代码版本：V9.0 (显示修复版)");

const db = window.supabase.createClient(supabaseUrl, supabaseKey);
const uploadBtn = document.getElementById('uploadBtn');
const gamesGrid = document.getElementById('gamesGrid');

// 👇 2. 上传功能
if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('gameName');
        const fileInput = document.getElementById('gameFile');
        
        if (!nameInput || !fileInput || !fileInput.files[0]) {
            alert("请填写名字并选择文件！");
            return;
        }

        uploadBtn.textContent = "正在上传...";
        uploadBtn.disabled = true;

        try {
            const file = fileInput.files[0];
            const safeName = `${Date.now()}_game.html`;
            // 强制文件编码为 UTF-8
            const newFile = new File([file], safeName, { type: 'text/html;charset=utf-8' });

            const { error: uploadError } = await db.storage
                .from('game-files')
                .upload(safeName, newFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = db.storage
                .from('game-files')
                .getPublicUrl(safeName);
                
            const { error: dbError } = await db.from('games').insert([
                { name: nameInput.value, url: urlData.publicUrl }
            ]);

            if (dbError) throw dbError;

            alert("发布成功！🎉");
            location.reload();

        } catch (error) {
            console.error(error);
            alert("上传失败：" + error.message);
            uploadBtn.textContent = "发布游戏"; 
            uploadBtn.disabled = false;
        }
    });
}

// 👇 3. 读取与开始游戏功能
async function loadGames() {
    if (!gamesGrid) return;

    const { data, error } = await db
        .from('games') 
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    gamesGrid.innerHTML = ''; 

    data.forEach((game) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        // --- 核心逻辑：点击开始游戏 ---
        const handlePlay = async (e) => {
            e.stopPropagation(); 
            const btn = e.target.closest('.play-btn') || e.target;
            const originalText = btn.innerText;
            btn.innerText = "🚀 启动中...";
            
            try {
                // A. 使用中转服务下载文件
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(game.url)}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error("下载失败");
                
                const blobData = await response.blob();
                
                // B. 【关键修复】强制标记为 HTML 网页
                const blob = new Blob([blobData], { type: 'text/html' }); 
                
                // C. 打开
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');

            } catch (err) {
                console.error("启动失败:", err);
                alert("启动出错，请重试");
            } finally {
                btn.innerText = originalText;
            }
        };

        card.innerHTML = `
            <div class="game-icon">🎮</div>
            <div class="game-title">${game.name}</div>
            <button class="play-btn">开始游玩</button>
        `;
        
        const btn = card.querySelector('.play-btn');
        btn.onclick = handlePlay;
        
        gamesGrid.appendChild(card);
    });
}

loadGames();
