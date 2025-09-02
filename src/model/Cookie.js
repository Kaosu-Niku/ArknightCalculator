const CookieModel = {
    // 取得 Cookie
    getCookie: (name) => {
        const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
            const [key, value] = cookie.split('=');
            acc[key] = value;
            return acc;
        }, {});

        const cookieValue = cookies[name];
        
        if (cookieValue) {
            try {
                return JSON.parse(cookieValue);
            } catch (e) {
                return cookieValue;
            }
        }
        
        // 沒有取得的預設值
        switch (name) {
            case 'type':
                return '精零1級';
            case 'rarity':
                return { "TIER_1": true, "TIER_2": true, "TIER_3": true, "TIER_4": true, "TIER_5": true, "TIER_6": true, };
            default:
                return undefined;
        }
    },

    // 設置 Cookie
    setCookie: (key, value) => {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        const expires = `expires=${expirationDate.toUTCString()}`;
        const path = 'path=/';
        const cookieValue = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value;
        document.cookie = `${key}=${cookieValue}; ${expires}; ${path};`;
    },
};

export default CookieModel;