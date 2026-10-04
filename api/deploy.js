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

        // 3. ຈັດການຂໍ້ມູນ HTML ຕາມ Mode ທີ່ຜູ້ໃຊ້ເລືອກ
        let finalHtml = htmlContent || '<h1>Welcome to ' + subdomain + '-tiny.surge.sh</h1>';

        // 4. ສົ່ງຄຳສັ່ງໄປ GitHub Repository
        const githubToken = process.env.GITHUB_TOKEN;
        const repoOwner = process.env.GITHUB_OWNER; // ບັນຊີ GitHub ຂອງເຈົ້າ
        const repoName = 'tinyweb';

        if (githubToken && repoOwner) {
            const path = `sites/${subdomain}/index.html`;
            const contentEncoded = Buffer.from(finalHtml).toString('base64');

            // 4.1 🔍 ກວດສອບກ่อนວ່າໄຟລ໌ນີ້ມີຢູ່ແລ້ວບໍ? (ເພື່ອເອົາມາອັບເດດທັບ)
            let existingSha = null;
            const checkRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, {
                method: 'GET',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'User-Agent': 'TinyWeb-Builder'
                }
            });

            if (checkRes.ok) {
                const fileData = await checkRes.json();
                existingSha = fileData.sha; // ຖ້າມີໄຟລ໌ເກົ່າ ຈະໄດ້ SHA ມາ
            }

            // 4.2 📤 ກະກຽມ Data ສໍາລັບ PUT Request
            const bodyData = {
                message: `Deploy site for ${subdomain}-tiny.surge.sh`,
                content: contentEncoded
            };

            // ຖ້າມີໄຟລ໌ເກົ່າ ຕ້ອງแนบ sha ໄປນຳ ເພື່ອໃຫ້ GitHub ยอมให้อັບເດດທັບ
            if (existingSha) {
                bodyData.sha = existingSha;
            }

            // ຍິງ API ไป GitHub ເພື່ອສ້າງ ຫຼື ອັບເດດໄຟລ໌
            const ghResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'TinyWeb-Builder'
                },
                body: JSON.stringify(bodyData)
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
            url: `https://${subdomain}-tiny.surge.sh`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
}
