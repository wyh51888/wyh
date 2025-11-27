// 1. 初始化 Supabase (请填入你的信息)
const supabaseUrl = 'https://uyvixbgmynvrfbfiewak.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dml4YmdteW52cmZiZmlld2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDg5NjcsImV4cCI6MjA3OTc4NDk2N30.vWD3rypscoap9mETCCD7hcEv6Fa8MCzGDEI42L7O3yg'; 

// 使用 window.supabase 创建客户端，并命名为 db，防止变量名冲突
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

const uploadBtn = document.getElementById('uploadBtn');
const gamesGrid = document.getElementById('gamesGrid');

// 2. 上传功能的全新逻辑
if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('gameName');
        const fileInput = document.getElementById('gameFile');
        
        // 检查元素是否存在
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
            // --- 【核心修复】彻底解决 Header 报错 ---
            
            // 1. 生成一个纯数字+英文的安全文件名
            const safeName = `${Date.now()}_game.html`;

            // 2. 创建一个新的 File 对象
            // 这一步是关键：它会丢弃原始文件的中文名，用 safeName 代替
            // 这样浏览器看到的永远是纯英文，绝对不会报 ISO-8859-1 错误
            const fileToUpload = new File([originalFile], safeName, { type: 'text/html' });

            // 3. 上传这个“纯净版”文件
            const { data: uploadData, error: uploadError } = await db
                .storage
                .from('game-files')
                .upload(safeName, fileToUpload, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'text/html' // 明确指定类型
                });

            if (uploadError) throw uploadError;

            // 4. 获取公开链接
            const { data: urlData } = db
                .storage
                .from('game-files')
                .getPublicUrl(safeName);
                
            const publicUrl = urlData.publicUrl;

            // 5. 存入数据库
            const { error: dbError } = await db
                .from('final_games')
                .insert([
                    { name: name, url: publicUrl }
                ]);

            if (dbError) throw dbError;

            alert("发布成功！");
            location.reload();

        } catch (error) {
            console.error("出错了:", error);
            // 详细展示错误信息
            alert("上传失败：" + (error.message || JSON.stringify(error)));
            uploadBtn.textContent = "发布游戏"; 
            uploadBtn.disabled = false;
        }
    });
}

// 3. 读取并显示游戏列表
async function loadGames() {
    if (!gamesGrid) return;

    const { data, error } = await db
        .from('final_games')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.log("读取失败:", error);
        return;
    }

    gamesGrid.innerHTML = ''; 

    data.forEach((game) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        // 点击卡片跳转
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
