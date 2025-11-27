// 1. 初始化 Supabase (填入你的信息)
const supabaseUrl = 'https://你的URL.supabase.co'; 
const supabaseKey = '你的anon_Key'; 
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const uploadBtn = document.getElementById('uploadBtn');
const gamesGrid = document.getElementById('gamesGrid');

// 2. 上传功能的全新逻辑
uploadBtn.addEventListener('click', async () => {
    const nameInput = document.getElementById('gameName');
    const fileInput = document.getElementById('gameFile');
    const file = fileInput.files[0]; // 获取用户选的文件
    const name = nameInput.value;

    if (!name || !file) {
        alert("请填写名字并选择一个 HTML 文件！");
        return;
    }

    // 给按钮加个“上传中...”的状态，防止重复点击
    uploadBtn.textContent = "正在上传...";
    uploadBtn.disabled = true;

    try {
        // A. 生成一个唯一的文件名 (防止重名覆盖)
        // 比如: 170123456789_mygame.html
        const fileName = `${Date.now()}_${file.name}`;

        // B. 上传文件到 'game-files' 桶
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('game-files')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // C. 获取这个文件的公开访问链接
        const { data: urlData } = supabase
            .storage
            .from('game-files')
            .getPublicUrl(fileName);
            
        const publicUrl = urlData.publicUrl;

        // D. 把游戏信息存入数据库
        const { error: dbError } = await supabase
            .from('games')
            .insert([
                { name: name, url: publicUrl }
            ]);

        if (dbError) throw dbError;

        alert("发布成功！");
        location.reload();

    } catch (error) {
        console.error("出错了:", error);
        alert("上传失败，请按 F12 看控制台报错信息");
        uploadBtn.textContent = "发布游戏"; // 恢复按钮
        uploadBtn.disabled = false;
    }
});

// 3. 读取并显示 (网格版)
async function loadGames() {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.log("读取失败:", error);
        return;
    }

    gamesGrid.innerHTML = ''; // 清空容器

    data.forEach((game) => {
        // 创建卡片 HTML
        const card = document.createElement('div');
        card.className = 'game-card';
        
        // 这里我们用一个通用的游戏手柄 Emoji 当图标
        // 点击整个卡片或者按钮都可以去玩
        card.innerHTML = `
            <div class="game-icon">🎮</div>
            <div class="game-title">${game.name}</div>
            <a href="${game.url}" target="_blank" class="play-btn">开始游玩</a>
        `;
        
        gamesGrid.appendChild(card);
    });
}

loadGames();
