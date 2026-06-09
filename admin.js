const authPanel = document.querySelector("#authPanel");
const authTitle = document.querySelector("#authTitle");
const authNote = document.querySelector("#authNote");
const authForm = document.querySelector("#authForm");
const authPassword = document.querySelector("#adminPassword");
const authConfirm = document.querySelector("#adminPasswordConfirm");
const confirmLabel = document.querySelector("#confirmLabel");
const authButton = document.querySelector("#authButton");
const resetPasswordButton = document.querySelector("#resetPassword");
const authMessage = document.querySelector("#authMessage");
const workspace = document.querySelector("#workspace");
const zipInput = document.querySelector("#zipInput");
const importButton = document.querySelector("#importZip");
const importMessage = document.querySelector("#importMessage");
const requestList = document.querySelector("#requestList");
const requestDetail = document.querySelector("#requestDetail");
const exportIndexButton = document.querySelector("#exportIndex");
const animatedItems = document.querySelectorAll("[data-animate]");

const authKey = "yummy-admin-auth";
const dbName = "yummy-request-vault";
const storeName = "packages";
let db;
let selectedId;

const showAllAnimatedItems = () => {
  animatedItems.forEach((item) => item.classList.add("is-visible"));
};

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px 120px 0px" }
  );

  animatedItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 6, 5) * 60}ms`;
    revealObserver.observe(item);
  });

  window.setTimeout(showAllAnimatedItems, 1400);
} else {
  showAllAnimatedItems();
}

const text = (value) => (value || "").toString();
const escapeHtml = (value) =>
  text(value).replace(/[&<>"']/g, (char) => (
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]
  ));

const digest = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const randomSalt = () => {
  const values = new Uint8Array(16);
  crypto.getRandomValues(values);
  return Array.from(values)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

const getAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(authKey) || "null");
  } catch {
    return null;
  }
};

const setAuthMode = () => {
  const existing = getAuth();
  if (existing?.salt && existing?.hash) {
    authTitle.textContent = "管理者登录";
    authNote.textContent = "输入本机管理密码后查看已导入的客户需求包。";
    confirmLabel.hidden = true;
    authButton.textContent = "登录";
  } else {
    authTitle.textContent = "设置管理密码";
    authNote.textContent = "首次使用请设置一个本机管理密码。它只保护当前浏览器里的本地索引，不会上传到网站服务器。";
    confirmLabel.hidden = false;
    authButton.textContent = "设置并进入";
  }
};

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const tx = (mode = "readonly") => db.transaction(storeName, mode).objectStore(storeName);

const getAllPackages = () =>
  new Promise((resolve, reject) => {
    const request = tx().getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

const putPackage = (record) =>
  new Promise((resolve, reject) => {
    const request = tx("readwrite").put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

const getPackage = (id) =>
  new Promise((resolve, reject) => {
    const request = tx().get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const deletePackage = (id) =>
  new Promise((resolve, reject) => {
    const request = tx("readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

const fileSize = (size) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const renderList = async () => {
  const packages = (await getAllPackages()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  requestList.innerHTML = "";

  if (!packages.length) {
    requestList.innerHTML = '<p class="admin-note">暂无导入项目。</p>';
    return;
  }

  for (const item of packages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `request-item${item.id === selectedId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(item.brief.clientName || item.fileName)}</strong>
      <span>${escapeHtml(item.brief.serviceType)} · ${escapeHtml(item.brief.deadline)} · ${escapeHtml(new Date(item.createdAt).toLocaleString())}</span>
    `;
    button.addEventListener("click", async () => {
      selectedId = item.id;
      await renderList();
      await renderDetail(item.id);
    });
    requestList.appendChild(button);
  }
};

const renderDetail = async (id) => {
  const item = await getPackage(id);
  if (!item) {
    requestDetail.className = "request-detail empty";
    requestDetail.textContent = "选择一个项目查看详情。";
    return;
  }

  const brief = item.brief || {};
  const files = item.files || [];
  const fileSummary = files.length
    ? files.map((file) => `${escapeHtml(file.name)} (${escapeHtml(fileSize(file.size))})`).join("<br>")
    : "暂无";
  requestDetail.className = "request-detail";
  requestDetail.innerHTML = `
    <dl class="detail-grid">
      <div class="detail-row"><dt>项目</dt><dd>${escapeHtml(brief.clientName)}</dd></div>
      <div class="detail-row"><dt>联系方式</dt><dd>${escapeHtml(brief.clientContact)}</dd></div>
      <div class="detail-row"><dt>PPT 类型</dt><dd>${escapeHtml(brief.projectType)}</dd></div>
      <div class="detail-row"><dt>服务需求</dt><dd>${escapeHtml(brief.serviceType)}</dd></div>
      <div class="detail-row"><dt>目标风格</dt><dd>${escapeHtml(brief.styleTone)}</dd></div>
      <div class="detail-row"><dt>预计页数</dt><dd>${escapeHtml(brief.pageCount)}</dd></div>
      <div class="detail-row"><dt>截止时间</dt><dd>${escapeHtml(brief.deadline)}</dd></div>
      <div class="detail-row"><dt>重点需求</dt><dd>${escapeHtml(brief.needDetail)}</dd></div>
      <div class="detail-row"><dt>参考资料</dt><dd>${fileSummary}</dd></div>
    </dl>
    <div class="detail-actions">
      <button class="button primary" type="button" id="downloadZip">下载原始 ZIP</button>
      <button class="button ghost" type="button" id="deleteItem">删除本地记录</button>
    </div>
  `;

  document.querySelector("#downloadZip").addEventListener("click", async () => {
    const record = await getPackage(id);
    const blob = new Blob([record.zip], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = record.fileName || "yummy-request.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.querySelector("#deleteItem").addEventListener("click", async () => {
    await deletePackage(id);
    selectedId = undefined;
    requestDetail.className = "request-detail empty";
    requestDetail.textContent = "选择一个项目查看详情。";
    await renderList();
  });
};

const unlock = async () => {
  db = await openDb();
  authPanel.hidden = true;
  workspace.hidden = false;
  await renderList();
};

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = authPassword.value;
  const existing = getAuth();

  if (!password || password.length < 6) {
    authMessage.textContent = "密码至少 6 位。";
    return;
  }

  if (existing?.salt && existing?.hash) {
    const hash = await digest(`${existing.salt}:${password}`);
    if (hash !== existing.hash) {
      authMessage.textContent = "密码不正确。";
      return;
    }
    await unlock();
    return;
  }

  if (password !== authConfirm.value) {
    authMessage.textContent = "两次输入的密码不一致。";
    return;
  }

  const salt = randomSalt();
  const hash = await digest(`${salt}:${password}`);
  localStorage.setItem(authKey, JSON.stringify({ salt, hash, createdAt: new Date().toISOString() }));
  await unlock();
});

resetPasswordButton.addEventListener("click", () => {
  localStorage.removeItem(authKey);
  authPassword.value = "";
  authConfirm.value = "";
  authMessage.textContent = "本机密码已重置。";
  setAuthMode();
});

importButton.addEventListener("click", async () => {
  const file = zipInput.files?.[0];
  if (!file) {
    importMessage.textContent = "请选择 ZIP 需求包。";
    return;
  }

  if (!window.JSZip) {
    importMessage.textContent = "ZIP 组件加载失败，请刷新页面。";
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const briefFile = zip.file("yummy-ppt-brief.json");
    const fallbackFile = zip.file("yummy-ppt-brief.txt");
    let brief;

    if (briefFile) {
      brief = JSON.parse(await briefFile.async("string"));
    } else {
      brief = {
        clientName: file.name.replace(/\.zip$/i, ""),
        needDetail: fallbackFile ? await fallbackFile.async("string") : "未找到需求摘要"
      };
    }

    const files = [];
    zip.forEach((path, entry) => {
      if (!entry.dir && path.startsWith("reference-files/")) {
        files.push({
          name: path.replace("reference-files/", ""),
          size: entry._data?.uncompressedSize || 0
        });
      }
    });

    const record = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      fileName: file.name,
      brief,
      files,
      zip: buffer
    };

    await putPackage(record);
    importMessage.textContent = `已导入：${brief.clientName || file.name}`;
    zipInput.value = "";
    selectedId = record.id;
    await renderList();
    await renderDetail(record.id);
  } catch (error) {
    importMessage.textContent = `导入失败：${error.message}`;
  }
});

exportIndexButton.addEventListener("click", async () => {
  const packages = await getAllPackages();
  const index = packages.map(({ zip, ...rest }) => rest);
  const blob = new Blob([JSON.stringify(index, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `yummy-request-index-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

setAuthMode();
