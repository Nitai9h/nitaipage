// ==Npplication==
// @name    国际化基础插件
// @id    i18n
// @version    1.0.0
// @updateUrl    https://nfdb.nitai.us.kg/i18n.js
// @description    提供页面翻译功能
// @author    Nitai
// @type    coreNpp
// @time    body
// @icon    https://nitai-images.pages.dev/nitaiPage/i18n.svg
// @forced    true
// @setting    true
// ==/Npplication==

(function () {
    const DB_NAME = 'translate';
    const DB_STORE = 'entries';
    const DB_VERSION = 1;

    let translationDict = {};
    let translationEnabled = false;
    let observer = null;

    const DB = {
        open(version = DB_VERSION) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, version);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(DB_STORE)) {
                        db.createObjectStore(DB_STORE);
                    }
                };

                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };

                request.onerror = (event) => {
                    console.error(`打开数据库 ${DB_NAME} 失败: ` + event.target.error.message);
                    reject(event.target.error);
                };
            });
        },

        getAllKeys() {
            return DB.open().then(db => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(DB_STORE, 'readonly');
                    const store = transaction.objectStore(DB_STORE);
                    const request = store.getAllKeys();

                    request.onsuccess = () => {
                        db.close();
                        resolve(request.result);
                    };

                    request.onerror = () => {
                        console.error(`获取所有翻译项失败`);
                        db.close();
                        reject(request.error);
                    };
                });
            });
        },

        get(key) {
            return DB.open().then(db => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(DB_STORE, 'readonly');
                    const store = transaction.objectStore(DB_STORE);
                    const request = store.get(key);

                    request.onsuccess = () => {
                        db.close();
                        resolve(request.result);
                    };

                    request.onerror = () => {
                        console.error(`获取翻译项 "${key}" 失败`);
                        db.close();
                        reject(request.error);
                    };
                });
            });
        },

        put(key, value) {
            return DB.open().then(db => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(DB_STORE, 'readwrite');
                    const store = transaction.objectStore(DB_STORE);
                    const request = store.put(value, key);

                    request.onsuccess = () => {
                        db.close();
                        resolve();
                    };

                    request.onerror = () => {
                        console.error(`保存翻译项 "${key}" 失败`);
                        db.close();
                        reject(request.error);
                    };
                });
            });
        },

        clear() {
            return DB.open().then(db => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(DB_STORE, 'readwrite');
                    const store = transaction.objectStore(DB_STORE);
                    const request = store.clear();

                    request.onsuccess = () => {
                        db.close();
                        resolve();
                    };

                    request.onerror = () => {
                        console.error(`清空 ${DB_STORE} 失败`);
                        db.close();
                        reject(request.error);
                    };
                });
            });
        }
    };

    const Translation = {
        text(text) {
            if (!text || typeof text !== 'string') return text;

            let translatedText = text;
            const matchedKeys = Object.keys(translationDict).filter(key =>
                text.toLowerCase().includes(key.toLowerCase())
            );

            matchedKeys.sort((a, b) => b.length - a.length);

            matchedKeys.forEach(key => {
                const regex = new RegExp(`${key}`, 'gi');
                translatedText = translatedText.replace(regex, translationDict[key]);
            });

            return translatedText;
        },

        element(element) {
            if (!element) return;

            if (Utils.shouldSkipTranslation(element)) return;

            if (element.nodeType === Node.TEXT_NODE) {
                if (Utils.shouldSkipTranslation(element.parentNode)) return;

                const originalText = element.textContent;
                const translatedText = Translation.text(originalText);
                if (originalText !== translatedText) {
                    element.textContent = translatedText;
                    if (element.parentNode && element.parentNode.dataset) {
                        element.parentNode.dataset.translated = 'true';
                    }
                }
                return;
            }

            if (element.nodeType === Node.ELEMENT_NODE && element.dataset && element.dataset.translated) {
                delete element.dataset.translated;
            }

            const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED'];
            if (element.tagName && skipTags.includes(element.tagName.toUpperCase())) return;

            if (element.attributes && element.attributes.length !== undefined) {
                const placeholderAttr = element.getAttributeNode('placeholder');
                if (placeholderAttr) {
                    const originalValue = placeholderAttr.value;
                    const translatedValue = Translation.text(originalValue);
                    if (originalValue !== translatedValue) {
                        placeholderAttr.value = translatedValue;
                        if (element.dataset) {
                            element.dataset.translated = 'true';
                        }
                    }
                }

                Array.from(element.attributes).forEach(attr => {
                    if (attr.name.toLowerCase() === 'title' || attr.name.toLowerCase() === 'alt') {
                        const originalValue = attr.value;
                        const translatedValue = Translation.text(originalValue);
                        if (originalValue !== translatedValue) {
                            attr.value = translatedValue;
                            if (element.dataset) {
                                element.dataset.translated = 'true';
                            }
                        }
                    }
                });
            }

            if (element.childNodes && element.childNodes.length !== undefined) {
                Array.from(element.childNodes).forEach(child => {
                    Translation.element(child);
                });
            }
        },

        init() {
            if (!translationEnabled) return;

            Translation.element(document.body);

            if (observer) observer.disconnect();

            observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            Translation.element(node);
                        });
                    }

                    if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
                        const textNode = mutation.target;
                        const originalText = textNode.textContent;
                        const translatedText = Translation.text(originalText);
                        if (originalText !== translatedText) {
                            textNode.textContent = translatedText;
                        }
                        if (textNode.parentNode && textNode.parentNode.dataset) {
                            textNode.parentNode.dataset.translated = 'true';
                        }
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        },

        stop() {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        }
    };

    const Utils = {
        shouldSkipTranslation(element) {
            if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

            let current = element;
            while (current) {
                if (current.nodeType === Node.ELEMENT_NODE &&
                    current.hasAttribute('translate') &&
                    current.getAttribute('translate') === 'none') {
                    return true;
                }
                current = current.parentNode;
            }
            return false;
        },

        getBrowserLanguage() {
            const languages = navigator.languages || [navigator.language];
            for (const lang of languages) {
                if (lang && lang.length >= 2) return lang;
            }
            return 'zh-CN';
        }
    };

    const Dict = {
        async load() {
            try {
                const keys = await DB.getAllKeys();
                translationDict = {};
                const promises = keys.map(key =>
                    DB.get(key).then(value => {
                        if (typeof value !== 'undefined') {
                            translationDict[key] = value;
                        }
                    })
                );
                await Promise.all(promises);
                translationEnabled = Object.keys(translationDict).length > 0;
                return translationEnabled;
            } catch (error) {
                console.error('加载翻译字典失败:', error);
                translationDict = {};
                translationEnabled = false;
                return false;
            }
        },

        async add(entries) {
            if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
                console.error('请传入对象');
                return false;
            }

            try {
                let addedCount = 0;
                for (const [originalText, translatedText] of Object.entries(entries)) {
                    if (!originalText || !translatedText) {
                        console.warn('空值被跳过');
                        continue;
                    }

                    if (typeof originalText !== 'string' || typeof translatedText !== 'string') {
                        console.warn(`非字符串条目被跳过: "${originalText}"`);
                        continue;
                    }

                    await DB.put(originalText, translatedText);
                    translationDict[originalText] = translatedText;
                    addedCount++;
                }

                if (addedCount > 0) {
                    return true;
                } else {
                    console.warn('添加翻译字典为空');
                    return false;
                }
            } catch (error) {
                console.error('翻译字典添加失败:', error);
                return false;
            }
        }
    };

    const Plugin = {

        async installGlobalTranslateNpplication(url) {
            try {
                const { metadata } = await getNpp({ url });
                if (!await verifyJSUrl(url)) {
                    console.error('无效的JS文件URL:' + url);
                    return false;
                }

                if (metadata.type !== 'translate') {
                    return false;
                }

                if (!['head', 'body'].includes(metadata.time)) {
                    console.error('无有效的加载时机');
                    return false;
                }

                const plugins = await getPluginsList();
                const existing = plugins.find(p => p.id === metadata.id);

                if (existing) {
                    const versionComparison = compareVersions(existing.version, metadata.version);
                    if (versionComparison >= 0) {
                        return true;
                    }
                }

                // 保存插件元数据和JS文件
                await savePluginMetadata(metadata);
                await saveJSFile(metadata.id, url);

                // 自动刷新页面
                window.location.reload();
                return true;
            } catch (error) {
                console.error(`安装失败: ${error.message}`);
                return false;
            }
        },

        async install(langCode) {
            try {
                await installGlobalTranslateNpplication(`https://nfdb.nitai.us.kg/translateGlobal-${langCode}.js`);
                localStorage.setItem('installedTranslationLang', langCode);
                return true;
            } catch (error) {
                try {
                    console.warn(`安装${langCode}失败, 尝试安装zh-CN`, error);
                    await installGlobalTranslateNpplication(`https://nfdb.nitai.us.kg/translateGlobal-zh-CN.js`);
                    localStorage.setItem('installedTranslationLang', `zh-CN`);
                    return true;
                } catch (error) {
                    console.warn('全局插件获取失败:', error);
                    return false;
                }
            }
        },

        async loadBasic() {
            try {
                const response = await fetch('./basicLanguageSetting.json');
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('加载基础语言配置失败:', error);
                return {};
            }
        }
    };

    async function init() {
        const preferredLang = Utils.getBrowserLanguage();
        const installedLang = localStorage.getItem('installedTranslationLang');

        let shouldInstall = false;

        if (!installedLang) {
            shouldInstall = true;
        } else if (installedLang === 'basic') {
            shouldInstall = true;
        }

        if (shouldInstall) {
            const installed = await Plugin.install(preferredLang);

            if (!installed) {
                const basicSetting = await Plugin.loadBasic();
                if (Object.keys(basicSetting).length > 0) {
                    const success = await Dict.add(basicSetting);
                    if (success) {
                        translationEnabled = true;
                        localStorage.setItem('installedTranslationLang', 'basic');
                    }
                }
            }
        }

        await Dict.load();

        if (translationEnabled) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', Translation.init);
            } else {
                Translation.init();
            }
        }
    }

    function createSettings() {
        const pluginId = 'i18n';
        const mainConts = document.querySelector(`.mainConts[data-value="${pluginId}"]`);

        if (mainConts) {
            const translationDiv = document.createElement('div');
            translationDiv.id = 'i18n_setting';
            translationDiv.className = 'set_tip set_tip_new';
            translationDiv.style.width = '100%';
            translationDiv.innerHTML = `
                <style>
                    .i18n-switch-container {
                        display: flex;
                        flex-direction: row;
                        flex-wrap: nowrap;
                        justify-content: space-between;
                        align-items: center;
                    }
                </style>
                <div class="i18n-switch-container">
                    <div>
                        <span class="set_text"><big>@i18n:setting-auto-install-translation-plugin&nbsp;</big><br></span>
                        <span class="set_text" style="color: gray;"><small>@i18n:setting-auto-install-translation-plugin-desc</small><br></span>
                        <span class="set_text" style="color: gray;"><small>@i18n:setting-auto-install-translation-plugin-lang</small><br></span>
                        <span class="set_text" style="color: gray;"><small>@i18n:setting-auto-install-translation-plugin-need-uninstall</small></span>
                    </div>
                    <div class="switch" id="toggleAutoInstallTranslation"></div>
                </div>
            `;
            mainConts.appendChild(translationDiv);
        }
    }

    document.addEventListener('pluginSettingsTemplateReady', function () {
        createSettings();

        const toggleSwitch = $('#toggleAutoInstallTranslation');
        const savedState = localStorage.getItem('autoInstallTranslation') || 'off';

        if (savedState === 'on') {
            toggleSwitch.addClass('on');
        }

        toggleSwitch.on('click', function () {
            const isOn = $(this).hasClass('on');
            if (isOn) {
                $(this).removeClass('on');
                localStorage.setItem('autoInstallTranslation', 'off');
            } else {
                $(this).addClass('on');
                localStorage.setItem('autoInstallTranslation', 'on');
            }
        });
    });

    init();

    window.i18n = {
        addTranslationEntries: Dict.add
    };
})();
