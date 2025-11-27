// 1. 初始化 (填你自己的)
const supabaseUrl = 'https://uyvixbgmynvrfbfiewak.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dml4YmdteW52cmZiZmlld2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDg5NjcsImV4cCI6MjA3OTc4NDk2N30.vWD3rypscoap9mETCCD7hcEv6Fa8MCzGDEI42L7O3yg'; 

console.log("🚀 代码版本：V8.0 (万能中转版)");

const db = window.supabase.createClient(supabaseUrl, supabaseKey);
const uploadBtn = document.getElementById('uploadBtn');
const gamesGrid = document.getElementById('gamesGrid');

// 2. 上传逻辑 (最简版)
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
            // 强制指定 UTF-8
            const newFile = new File([file], safeName, { type: 'text/html;charset=utf-8' });

            // 上传
            const { error: uploadError } = await db.storage
                .from('game-files')
                .upload(safeName, newFile);

            if (uploadError) throw uploadError;

            // 获取链接
            const { data: urlData } = db.storage
                .from('game-files')
                .getPublicUrl(safeName);
                
            // 存数据库
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

// 3. 读取逻辑 (使用中转服务绕过 CORS)
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
        
        const handlePlay = async (e) => {
            e.stopPropagation(); 
            const btn = e.target.closest('.play-btn') || e.target;
            const originalText = btn.innerText;
            btn.innerText = "🚀 启动中...";
            
            try {
                // --- 核心黑科技 ---
                // 使用 allorigins.win 中转服务来下载文件
                // 这样 Supabase 就不知道是我们下载的，也就不会拦截 CORS 了
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(game.url)}`;
                
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error("下载失败");
                
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                window.open(blobUrl, '_blank');
            } catch (err) {
                console.error("启动失败:", err);
                // 如果中转也失败，就直接打开原链接试试运气
                window.open(game.url, '_blank');
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
