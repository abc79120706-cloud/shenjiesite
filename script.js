const animatedItems = document.querySelectorAll("[data-animate]");

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

const ownerEmail = "2455407376@qq.com";
const ownerWechat = "1887844829";

const fields = {
  clientName: document.querySelector("#clientName"),
  clientContact: document.querySelector("#clientContact"),
  projectType: document.querySelector("#projectType"),
  serviceType: document.querySelector("#serviceType"),
  styleTone: document.querySelector("#styleTone"),
  pageCount: document.querySelector("#pageCount"),
  deadline: document.querySelector("#deadline"),
  needDetail: document.querySelector("#needDetail"),
  referenceFiles: document.querySelector("#referenceFiles")
};

const output = document.querySelector("#briefOutput");
const buildPackageButton = document.querySelector("#buildPackage");
const copyBriefButton = document.querySelector("#copyBrief");
const emailBriefButton = document.querySelector("#emailBrief");

const safeName = (value) =>
  (value || "yummy-ppt-request")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 60);

const getBrief = () => {
  const files = Array.from(fields.referenceFiles.files || []).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || "unknown"
  }));

  return {
    studio: "yummy",
    ownerEmail,
    ownerWechat,
    createdAt: new Date().toISOString(),
    clientName: fields.clientName.value.trim() || "待确认项目",
    clientContact: fields.clientContact.value.trim() || "待确认",
    projectType: fields.projectType.value,
    serviceType: fields.serviceType.value,
    styleTone: fields.styleTone.value,
    pageCount: fields.pageCount.value.trim() || "待确认",
    deadline: fields.deadline.value.trim() || "待确认",
    needDetail:
      fields.needDetail.value.trim() ||
      "希望 yummy 协助评估 PPT 定制、美化或改稿方案。",
    files
  };
};

const formatBriefText = (brief) =>
  [
    "yummy PPT 定制与美化需求包",
    "",
    `项目称呼：${brief.clientName}`,
    `客户联系方式：${brief.clientContact}`,
    `PPT 类型：${brief.projectType}`,
    `服务需求：${brief.serviceType}`,
    `目标风格：${brief.styleTone}`,
    `预计页数：${brief.pageCount}`,
    `截止时间：${brief.deadline}`,
    `重点需求：${brief.needDetail}`,
    "",
    `参考资料：${brief.files.length ? brief.files.map((file) => file.name).join("、") : "暂无"}`,
    "",
    `请发送至：${ownerEmail}`,
    `微信同号：${ownerWechat}`
  ].join("\n");

const setOutput = (message) => {
  output.textContent = message;
  output.classList.add("active");
};

const buildZipPackage = async () => {
  if (!window.JSZip) {
    setOutput("需求包组件加载失败，请刷新页面后重试，或直接复制需求文本发送邮件。");
    return;
  }

  const brief = getBrief();
  const zip = new JSZip();
  const text = formatBriefText(brief);

  zip.file("yummy-ppt-brief.txt", text);
  zip.file("yummy-ppt-brief.json", JSON.stringify(brief, null, 2));

  const folder = zip.folder("reference-files");
  const files = Array.from(fields.referenceFiles.files || []);
  for (const file of files) {
    folder.file(file.name, await file.arrayBuffer());
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `${safeName(brief.clientName)}-yummy-ppt-request.zip`;
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  setOutput(`${text}\n\n已生成 ZIP：${filename}\n请把 ZIP 作为附件发送到 ${ownerEmail}。`);
};

const copyBrief = async () => {
  const text = formatBriefText(getBrief());
  try {
    await navigator.clipboard.writeText(text);
    setOutput(`${text}\n\n需求文本已复制。`);
  } catch {
    setOutput(text);
  }
};

const openEmail = () => {
  const brief = getBrief();
  const subject = encodeURIComponent(`yummy PPT 需求：${brief.clientName}`);
  const body = encodeURIComponent(
    `${formatBriefText(brief)}\n\n如已生成 ZIP 需求包，请把 ZIP 添加为邮件附件。`
  );
  window.location.href = `mailto:${ownerEmail}?subject=${subject}&body=${body}`;
};

buildPackageButton?.addEventListener("click", buildZipPackage);
copyBriefButton?.addEventListener("click", copyBrief);
emailBriefButton?.addEventListener("click", openEmail);
