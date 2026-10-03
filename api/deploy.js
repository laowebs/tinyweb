// api/deploy.js - Vercel Serverless Function ສຳລັບ TinyWeb
export default async function handler(req, res) {
    // ໃຫ້ສະເພາະ POST Request ເທົ່ານັ້ນ
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { subdomain, htmlContent, mode } = req.body;

        // 1. ກວດສອບວ່າ Subdomain ຖືກຕ້ອງຕາມກົດລະບຽບ ຫຼື ບໍ່
        if (!subdomain || !/^[a-z0-9-]+$/.test(subdomain)) {
            return res.status(400).json({ success: false, error: 'ຊື່ Subdomain ບໍ່ຖືກຕ້ອງ (ໃຊ້ໄດ້ສະເພາະ a-z, 0-9 ແລະ -)' });
        }

        // 2. ປ້ອງກັນ Subdomain ຫ້າມຊ້ຳ (ຕົວຢ່າງ: ລະບົບ Reserved Names)
        const reservedNames = ['www', 'api', 'admin', 'app', 'tinyweb'];
        if (reservedNames.includes(subdomain.toLowerCase())) {
            return res.status(400).json({ success: false, error: 'ຊື່ Subdomain ນີ້ຖືກສະຫງວນໄວ້ແລ້ວ' });
        }

        // 3. ຈັດການຂໍ້ມູນ HTML ຕາມ Mode ທີ່ຜູ້ໃຊ້ເລືອກ (Single, Paste, ຯລຯ)
        let finalHtml = htmlContent || '<h1>Welcome to ' + subdomain + '.laowebs.com</h1>';

        // 4. ສົ່ງຄຳສັ່ງໄປ GitHub Repository ຂອງເຈົ້າ (ເພື່ອໃຫ້ GitHub Actions ດຶງໄປ Deploy ຂຶ້ນ Surge)
        // (ໃນຂັ້ນຕອນນີ້ Vercel API จะทำหน้าที่ Commit ไฟล์ HTML ลงใน GitHub ตามชื่อ Subdomain)
        const githubToken = process.env.GITHUB_TOKEN;
        const repoOwner = process.env.GITHUB_OWNER; // ບັນຊີ GitHub ຂອງເຈົ້າ
        const repoName = 'tinyweb';

        if (githubToken && repoOwner) {
            const path = `sites/${subdomain}/index.html`;
            const contentEncoded = Buffer.from(finalHtml).toString('base64');

            // ຍິງ API ໄປ GitHub ເພື່ອສ້າງໄຟລ໌
            const ghResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'TinyWeb-Builder'
                },
                body: JSON.stringify({
                    message: `Deploy site for ${subdomain}.laowebs.com`,
                    content: contentEncoded
                })
            });

            if (!ghResponse.ok) {
                const errData = await ghResponse.json();
                throw new Error(errData.message || 'GitHub API Error');
            }
        }

        // ສົ່ງຜົນສຳເລັດກັບຄືນຫາ Frontend
        return res.status(200).json({
            success: true,
            message: `ສ້າງເວັບໄຊສຳເລັດແລ້ວ!`,
            url: `https://${subdomain}.laowebs.com`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
}
