"use strict";

const $ = document.querySelector.bind(document);

twpConfig
  .onReady()
  .then(() => twpI18n.updateUiMessages())
  .then(() => {
    twpI18n.translateDocument();

    const originalLanguageFrom = $("#original-language-from");
    const targetLanguageTo = $("#target-language-to");
    const selectOriginalLanguage = $("#select-original-language");
    const selectTargetLanguage = $("#select-target-language");
    const btnTranslate = $("#btn-translate");
    const btnShowOriginal = $("#btn-show-original");
    const statusTranslating = $("#status-translating");
    const statusError = $("#status-error");
    const statusContainer = $("#status-container");
    const btnOptions = $("#btn-options");
    const btnSwapLanguages = $("#swap-languages");

    let originalTabLanguage = "und";
    let currentPageLanguage = "und";

    // Fill language lists
    const langs = twpLang.getLanguageList();
    const langsSorted = [];
    for (const i in langs) {
      langsSorted.push([i, langs[i]]);
    }
    langsSorted.sort((a, b) => a[1].localeCompare(b[1]));

    langsSorted.forEach(([langCode, langName]) => {
      const option = document.createElement("option");
      option.value = langCode;
      option.textContent = langName;
      selectOriginalLanguage.appendChild(option.cloneNode(true));
      selectTargetLanguage.appendChild(option);
    });

    const recents = twpConfig.get("targetLanguages");
    if (recents.length > 0) {
      const recentOptgroup = document.createElement("optgroup");
      recentOptgroup.label = twpI18n.getMessage("msgRecents");
      recents.forEach((langCode) => {
        const option = document.createElement("option");
        option.value = langCode;
        option.textContent = langs[langCode];
        recentOptgroup.appendChild(option);
      });
      selectTargetLanguage.prepend(recentOptgroup);
    }

    const targetLanguage = twpConfig.get("targetLanguage");
    selectTargetLanguage.value = targetLanguage;
    targetLanguageTo.textContent = langs[targetLanguage];

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getOriginalTabLanguage" },
        { frameId: 0 },
        (tabLanguage) => {
          checkedLastError();
          if (tabLanguage && (tabLanguage = twpLang.fixTLanguageCode(tabLanguage))) {
            originalTabLanguage = tabLanguage;
            selectOriginalLanguage.value = originalTabLanguage;
            originalLanguageFrom.textContent = langs[originalTabLanguage];
          }
        }
      );
    });

    const translateOriginalLanguageText = $("#translate-original-language-text");
    const translateTargetLanguageText = $("#translate-target-language-text");
    const selectOriginalLanguageContainer = $("#select-original-language-container");
    const selectTargetLanguageContainer = $("#select-target-language-container");

    const showOriginalLanguageSelect = () => {
        translateOriginalLanguageText.style.display = "none";
        selectOriginalLanguageContainer.style.display = "flex";
    };

    const showTargetLanguageSelect = () => {
        translateTargetLanguageText.style.display = "none";
        selectTargetLanguageContainer.style.display = "flex";
    };

    originalLanguageFrom.addEventListener("click", showOriginalLanguageSelect);
    targetLanguageTo.addEventListener("click", showTargetLanguageSelect);

    selectOriginalLanguage.addEventListener("change", () => {
        originalLanguageFrom.textContent = langs[selectOriginalLanguage.value];
        originalTabLanguage = selectOriginalLanguage.value;
        translateOriginalLanguageText.style.display = "flex";
        selectOriginalLanguageContainer.style.display = "none";
    });

    selectTargetLanguage.addEventListener("change", () => {
        targetLanguageTo.textContent = langs[selectTargetLanguage.value];
        translateTargetLanguageText.style.display = "flex";
        selectTargetLanguageContainer.style.display = "none";
    });

    btnSwapLanguages.addEventListener("click", () => {
        const originalLang = selectOriginalLanguage.value;
        const targetLang = selectTargetLanguage.value;

        selectOriginalLanguage.value = targetLang;
        selectTargetLanguage.value = originalLang;

        originalLanguageFrom.textContent = langs[targetLang];
        targetLanguageTo.textContent = langs[originalLang];

        originalTabLanguage = targetLang;
    });

    const translate = () => {
        showTranslating();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const targetLanguage = selectTargetLanguage.value;
            if (targetLanguage !== twpConfig.get("targetLanguage")) {
                twpConfig.setTargetLanguage(targetLanguage, true);
            }

            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  action: "translatePage",
                  targetLanguage: targetLanguage,
                  originalLanguage: originalTabLanguage,
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        showError();
                    } else {
                        showTranslated();
                    }
                }
              );
        });
    };

    const showOriginal = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "restorePage" },
                (response) => {
                    if (chrome.runtime.lastError) {
                        showError();
                    } else {
                        showTranslate();
                    }
                }
            );
        });
    };

    const showTranslating = () => {
        statusContainer.style.display = "block";
        statusTranslating.style.display = "block";
        statusError.style.display = "none";
        btnTranslate.style.display = "none";
        btnShowOriginal.style.display = "none";
    };

    const showTranslated = () => {
        statusContainer.style.display = "none";
        btnTranslate.style.display = "none";
        btnShowOriginal.style.display = "block";
    };

    const showError = () => {
        statusContainer.style.display = "block";
        statusTranslating.style.display = "none";
        statusError.style.display = "block";
        btnTranslate.style.display = "block";
        btnShowOriginal.style.display = "none";
    };

    const showTranslate = () => {
        statusContainer.style.display = "none";
        btnTranslate.style.display = "block";
        btnShowOriginal.style.display = "none";
    };

    btnTranslate.addEventListener("click", translate);
    btnShowOriginal.addEventListener("click", showOriginal);

    if (twpConfig.get("darkMode") == "auto") {
        if (matchMedia("(prefers-color-scheme: dark)").matches) {
            document.body.classList.add("dark");
        }
    } else if (twpConfig.get("darkMode") == "yes") {
        document.body.classList.add("dark");
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "getCurrentPageLanguageState" },
            { frameId: 0 },
            (pageLanguageState) => {
                checkedLastError();
                if (pageLanguageState === "translated") {
                    showTranslated();
                } else {
                    showTranslate();
                }
            }
        );
    });

    $("#btn-options").addEventListener("change", (event) => {
        const btnOptions = event.target;

        chrome.tabs.query(
            {
                active: true,
                currentWindow: true,
            },
            (tabs) => {
                const hostname = new URL(tabs[0].url).hostname;
                switch (btnOptions.value) {
                    case "alwaysTranslateThisSite":
                        if (
                            twpConfig.get("alwaysTranslateSites").indexOf(hostname) === -1
                        ) {
                            twpConfig.addSiteToAlwaysTranslate(hostname);
                            translate();
                        } else {
                            twpConfig.removeSiteFromAlwaysTranslate(hostname);
                        }
                        window.close();
                        break;
                    case "neverTranslateThisSite":
                        if (
                            twpConfig.get("neverTranslateSites").indexOf(hostname) === -1
                        ) {
                            twpConfig.addSiteToNeverTranslate(hostname);
                            chrome.tabs.sendMessage(tabs[0].id, { action: "restorePage" }, checkedLastError);
                        } else {
                            twpConfig.removeSiteFromNeverTranslate(hostname);
                        }
                        window.close();
                        break;
                    case "neverTranslateThisLanguage":
                        if (
                            twpConfig
                                .get("neverTranslateLangs")
                                .indexOf(originalTabLanguage) === -1
                        ) {
                            twpConfig.addLangToNeverTranslate(
                                originalTabLanguage,
                                hostname
                            );
                            chrome.tabs.sendMessage(tabs[0].id, { action: "restorePage" }, checkedLastError);
                        } else {
                            twpConfig.removeLangFromNeverTranslate(originalTabLanguage);
                        }
                        window.close();
                        break;
                    case "showTranslateSelectedButton":
                        if (twpConfig.get("showTranslateSelectedButton") === "yes") {
                            twpConfig.set("showTranslateSelectedButton", "no");
                        } else {
                            twpConfig.set("showTranslateSelectedButton", "yes");
                        }
                        window.close();
                        break;
                    case "showOriginalTextWhenHovering":
                        if (twpConfig.get("showOriginalTextWhenHovering") === "yes") {
                            twpConfig.set("showOriginalTextWhenHovering", "no");
                        } else {
                            twpConfig.set("showOriginalTextWhenHovering", "yes");
                        }
                        window.close();
                        break;
                    case "showTranslatedWhenHoveringThisSite":
                        if (
                            twpConfig
                                .get("sitesToTranslateWhenHovering")
                                .indexOf(hostname) === -1
                        ) {
                            twpConfig.addSiteToTranslateWhenHovering(hostname);
                        } else {
                            twpConfig.removeSiteFromTranslateWhenHovering(hostname);
                        }
                        window.close();
                        break;
                    case "showTranslatedWhenHoveringThisLang":
                        if (
                            twpConfig
                                .get("langsToTranslateWhenHovering")
                                .indexOf(originalTabLanguage) === -1
                        ) {
                            twpConfig.addLangToTranslateWhenHovering(originalTabLanguage);
                        } else {
                            twpConfig.removeLangFromTranslateWhenHovering(
                                originalTabLanguage
                            );
                        }
                        window.close();
                        break;
                    case "translateInExternalSite":
                        chrome.tabs.query(
                            {
                                active: true,
                                currentWindow: true,
                            },
                            (tabs) => {
                                // TODO: Add support for Yandex
                                tabsCreate(
                                    `https://translate.google.com/translate?tl=${twpConfig.get(
                                        "targetLanguage"
                                    )}&u=${encodeURIComponent(tabs[0].url)}`
                                );
                            }
                        );
                        break;
                    case "Settings":
                        chrome.runtime.openOptionsPage();
                        break;
                    default:
                        break;
                }
                btnOptions.value = "options";
            }
        );
    });

    chrome.tabs.query(
        {
            active: true,
            currentWindow: true,
        },
        (tabs) => {
            const hostname = new URL(tabs[0].url).hostname;

            const btnNeverTranslateText = twpI18n.getMessage("btnNeverTranslate");
            if (twpConfig.get("neverTranslateSites").indexOf(hostname) === -1) {
                $("option[data-i18n=btnNeverTranslate]").textContent =
                    btnNeverTranslateText;
            } else {
                $("option[data-i18n=btnNeverTranslate]").textContent =
                    "✔ " + btnNeverTranslateText;
            }

            const btnAlwaysTranslateText = twpI18n.getMessage("btnAlwaysTranslate");
            if (twpConfig.get("alwaysTranslateSites").indexOf(hostname) === -1) {
                $("option[data-i18n=btnAlwaysTranslate]").textContent =
                    btnAlwaysTranslateText;
            } else {
                $("option[data-i18n=btnAlwaysTranslate]").textContent =
                    "✔ " + btnAlwaysTranslateText;
            }

            {
                const text = twpI18n.getMessage("lblShowTranslateSelectedButton");
                if (twpConfig.get("showTranslateSelectedButton") !== "yes") {
                    $("option[data-i18n=lblShowTranslateSelectedButton]").textContent =
                        text;
                } else {
                    $("option[data-i18n=lblShowTranslateSelectedButton]").textContent =
                        "✔ " + text;
                }
            }
            {
                const text = twpI18n.getMessage("lblShowOriginalTextWhenHovering");
                if (twpConfig.get("showOriginalTextWhenHovering") !== "yes") {
                    $("option[data-i18n=lblShowOriginalTextWhenHovering]").textContent =
                        text;
                } else {
                    $("option[data-i18n=lblShowOriginalTextWhenHovering]").textContent =
                        "✔ " + text;
                }
            }
            {
                const text = twpI18n.getMessage(
                    "lblShowTranslatedWhenHoveringThisSite"
                );
                if (
                    twpConfig.get("sitesToTranslateWhenHovering").indexOf(hostname) ===
                    -1
                ) {
                    $(
                        "option[data-i18n=lblShowTranslatedWhenHoveringThisSite]"
                    ).textContent = text;
                } else {
                    $(
                        "option[data-i18n=lblShowTranslatedWhenHoveringThisSite]"
                    ).textContent = "✔ " + text;
                }
            }
        }
    );
  });