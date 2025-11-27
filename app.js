// 1. 初始化 Supabase (请务必填入你最新的 URL 和 Key)
const supabaseUrl = 'https://uyvixbgmynvrfbfiewak.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dml4YmdteW52cmZiZmlld2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDg5NjcsImV4cCI6MjA3OTc4NDk2N30.vWD3rypscoap9mETCCD7hcEv6Fa8MCzGDEI42L7O3yg'; 

// --- 调试监控 (放在定义之后) ---
console.log("🚀 正在运行的代码版本：V6.0 (最终修复版)");
console.log("🔑 使用的 URL:", supabaseUrl);
// 只打印前5位，方便核对又保护隐私
if (supabaseKey) {
    console.log("🔑 使用的 Key (前5位):", supabaseKey.substring(0, 5));
} else {
    console.error("❌ 警告：Supabase Key 未填写！");
}

// 创建客户端
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

const uploadBtn = document.getElementById('uploadBtn');
const gamesGrid = document.getElementById('gamesGrid');

// 2. 上传功能的逻辑
if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('gameName');
        const fileInput = document.getElementById('gameFile');
        
        if (!nameInput || !fileInput) {
            alert("页面元素缺失，请检查 HTML ID");
            return;
        }

        const originalFile = fileInput.files[0]; 
        const name = nameInput.value;

        if (!name || !originalFile) {
            alert("请填写名字并选择一个 HTML 文件！");
            return;
        }

        uploadBtn.textContent = "正在上传...";
        uploadBtn.disabled = true;

        try {
            // --- 【核心修复】防止 Header 报错 ---
            // 生成纯数字+英文的安全文件名
            const safeName = `${Date.now()}_game.html`;

            // 创建一个新的“纯净版”文件对象
            const fileToUpload = new File([originalFile], safeName, { type: 'text/html' });

            // 3. 上传文件
            const { data: uploadData, error: uploadError } = await db
                .storage
                .from('game-files') // 确保你的 Storage Bucket 叫这个名字
                .upload(safeName, fileToUpload, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'text/html'
                });

            if (uploadError) throw uploadError;

            // 4. 获取公开链接
            const { data: urlData } = db
                .storage
                .from('game-files')
                .getPublicUrl(safeName);
                
            const publicUrl = urlData.publicUrl;

            // 5. 存入数据库
            // ⚠️ 注意：如果你刚才新建了 final_games 表，请把下面的 'games' 改成 'final_games'
            const { error: dbError } = await db
                .from('final_games') 
                .insert([
                    { name: name, url: publicUrl }
                ]);

            if (dbError) throw dbError;

            alert("发布成功！🎉");
            location.reload();

        } catch (error) {
            console.error("详细错误信息:", error);
            alert("上传失败：" + (error.message || JSON.stringify(error)));
            uploadBtn.textContent = "发布游戏"; 
            uploadBtn.disabled = false;
        }
    });
}

// 3. 读取并显示游戏列表
async function loadGames() {
    if (!gamesGrid) return;

    // ⚠️ 注意：如果你改了表名，这里也要改
    const { data, error } = await db
        .from('final_games') 
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.log("读取列表失败:", error);
        return;
    }

    gamesGrid.innerHTML = ''; 

    data.forEach((game) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        card.onclick = () => window.open(game.url, '_blank');
        
        card.innerHTML = `
            <div class="game-icon">🎮</div>
            <div class="game-title">${game.name}</div>
            <a href="${game.url}" target="_blank" class="play-btn" onclick="event.stopPropagation()">开始游玩</a>
        `;
        
        gamesGrid.appendChild(card);
    });
}

// 启动加载
loadGames();
