"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main/main.ts
var import_electron = require("electron");
var path = __toESM(require("path"));
var import_electron_store = __toESM(require("electron-store"));

// src/shared/types.ts
var DEFAULT_SETTINGS = {
  openaiApiKey: "",
  openaiBaseUrl: "https://api.openai.com/v1",
  modelName: "gpt-4o-mini",
  notificationsEnabled: true,
  notificationTime: "09:00",
  dailyTaskCount: 3,
  theme: "dark"
};

// node_modules/uuid/dist-node/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist-node/rng.js
var import_node_crypto = require("node:crypto");
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    (0, import_node_crypto.randomFillSync)(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/uuid/dist-node/native.js
var import_node_crypto2 = require("node:crypto");
var native_default = { randomUUID: import_node_crypto2.randomUUID };

// node_modules/uuid/dist-node/v4.js
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  return _v4(options, buf, offset);
}
var v4_default = v4;

// src/main/main.ts
var store = new import_electron_store.default({
  defaults: {
    goals: [],
    tasks: [],
    settings: DEFAULT_SETTINGS
  }
});
var mainWindow = null;
var tray = null;
var notificationInterval = null;
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0a0a0a",
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.on("minimize", (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });
}
function createTray() {
  const icon = import_electron.nativeImage.createEmpty();
  tray = new import_electron.Tray(icon);
  const contextMenu = import_electron.Menu.buildFromTemplate([
    { label: "Open Guiding Moonlight", click: () => mainWindow?.show() },
    { label: "Check Today's Tasks", click: () => showDailyNotification() },
    { type: "separator" },
    { label: "Quit", click: () => import_electron.app.quit() }
  ]);
  tray.setToolTip("Guiding Moonlight");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => mainWindow?.show());
}
function showDailyNotification() {
  const tasks = store.get("tasks");
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.scheduledDate === today && t.status === "pending");
  if (todayTasks.length > 0) {
    const notification = new import_electron.Notification({
      title: "Guiding Moonlight",
      body: `You have ${todayTasks.length} task(s) today: ${todayTasks[0].title}`,
      urgency: "normal"
    });
    notification.on("click", () => mainWindow?.show());
    notification.show();
  }
}
function setupNotificationScheduler() {
  if (notificationInterval) clearInterval(notificationInterval);
  notificationInterval = setInterval(() => {
    const settings = store.get("settings");
    if (!settings.notificationsEnabled) return;
    const now = /* @__PURE__ */ new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    if (currentTime === settings.notificationTime) {
      showDailyNotification();
    }
  }, 6e4);
}
import_electron.ipcMain.handle("get-goals", () => store.get("goals"));
import_electron.ipcMain.handle("get-tasks", () => store.get("tasks"));
import_electron.ipcMain.handle("get-settings", () => store.get("settings"));
import_electron.ipcMain.handle("save-goal", (_event, goal) => {
  const goals = store.get("goals");
  const index = goals.findIndex((g) => g.id === goal.id);
  if (index >= 0) {
    goals[index] = goal;
  } else {
    goals.push(goal);
  }
  store.set("goals", goals);
  return goals;
});
import_electron.ipcMain.handle("delete-goal", (_event, goalId) => {
  const goals = store.get("goals");
  const tasks = store.get("tasks");
  store.set("goals", goals.filter((g) => g.id !== goalId));
  store.set("tasks", tasks.filter((t) => t.goalId !== goalId));
  return store.get("goals");
});
import_electron.ipcMain.handle("save-tasks", (_event, newTasks) => {
  const tasks = store.get("tasks");
  newTasks.forEach((newTask) => {
    const index = tasks.findIndex((t) => t.id === newTask.id);
    if (index >= 0) {
      tasks[index] = newTask;
    } else {
      tasks.push(newTask);
    }
  });
  store.set("tasks", tasks);
  return tasks;
});
import_electron.ipcMain.handle("update-task", (_event, task) => {
  const tasks = store.get("tasks");
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
    store.set("tasks", tasks);
  }
  return tasks;
});
import_electron.ipcMain.handle("save-settings", (_event, settings) => {
  store.set("settings", settings);
  setupNotificationScheduler();
  return settings;
});
import_electron.ipcMain.handle("window-minimize", () => mainWindow?.minimize());
import_electron.ipcMain.handle("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
import_electron.ipcMain.handle("window-close", () => mainWindow?.hide());
import_electron.ipcMain.handle("show-notification", (_event, title, body) => {
  const notification = new import_electron.Notification({ title, body });
  notification.show();
});
import_electron.ipcMain.handle("ai-test-connection", async (_event, baseUrl, apiKey) => {
  try {
    const headers = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const response = await fetch(`${baseUrl}/models`, { headers });
    return response.ok;
  } catch (error) {
    console.error("AI connection test failed:", error);
    return false;
  }
});
import_electron.ipcMain.handle("ai-generate-tasks", async (_event, goal, settings, existingTasks) => {
  const completedCount = existingTasks.filter((t) => t.goalId === goal.id && t.status === "completed").length;
  const prompt = `You are a productivity assistant. The user has a goal they want to achieve.

Goal: "${goal.title}"
Description: "${goal.description}"
${goal.targetDate ? `Target completion date: ${goal.targetDate}` : "No specific deadline"}
Tasks already completed for this goal: ${completedCount}

Generate ${settings.dailyTaskCount * 7} specific, actionable daily tasks that will help achieve this goal over the next week or so. Each task should:
1. Be completable in one day
2. Be specific and actionable (not vague)
3. Build progressively towards the goal
4. Account for progress already made (${completedCount} tasks completed)

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "tasks": [
    {
      "title": "Task title here",
      "description": "Detailed description of what to do",
      "difficulty": "easy",
      "estimatedMinutes": 30,
      "daysFromNow": 0
    }
  ]
}

Where difficulty is one of: "easy", "medium", or "hard"
And daysFromNow is 0 for today, 1 for tomorrow, etc.`;
  const headers = {
    "Content-Type": "application/json"
  };
  if (settings.openaiApiKey) {
    headers["Authorization"] = `Bearer ${settings.openaiApiKey}`;
  }
  const isLocal = settings.openaiBaseUrl.includes("localhost") || settings.openaiBaseUrl.includes("127.0.0.1") || settings.openaiBaseUrl.includes("172.") || settings.openaiBaseUrl.includes("192.168.") || settings.openaiBaseUrl.includes("10.");
  const requestBody = {
    model: settings.modelName,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  };
  if (!isLocal) {
    requestBody.response_format = { type: "json_object" };
  }
  console.log("Making AI request to:", `${settings.openaiBaseUrl}/chat/completions`);
  console.log("Request body:", JSON.stringify(requestBody, null, 2));
  const response = await fetch(`${settings.openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    const error = await response.text();
    console.error("AI request failed:", error);
    throw new Error(`AI request failed: ${error}`);
  }
  const data = await response.json();
  console.log("AI response:", JSON.stringify(data, null, 2));
  let content;
  if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    content = data.choices[0]?.message?.content;
  } else if (data.response) {
    content = data.response;
  } else if (data.content) {
    content = data.content;
  } else if (data.message?.content) {
    content = data.message.content;
  } else if (typeof data === "string") {
    content = data;
  }
  if (!content) {
    console.error("Could not extract content from response:", data);
    throw new Error(`No content in AI response. Response structure: ${JSON.stringify(Object.keys(data))}`);
  }
  console.log("Extracted content:", content.substring(0, 500));
  let jsonContent = content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonContent = jsonMatch[0];
  }
  const parsed = JSON.parse(jsonContent);
  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error("AI response missing tasks array");
  }
  const today = /* @__PURE__ */ new Date();
  return parsed.tasks.map((task) => {
    const scheduledDate = new Date(today);
    scheduledDate.setDate(scheduledDate.getDate() + (task.daysFromNow || 0));
    return {
      id: v4_default(),
      goalId: goal.id,
      title: task.title || "Untitled Task",
      description: task.description || "",
      scheduledDate: scheduledDate.toISOString().split("T")[0],
      status: "pending",
      difficulty: task.difficulty || "medium",
      estimatedMinutes: task.estimatedMinutes || 30
    };
  });
});
import_electron.app.whenReady().then(() => {
  createWindow();
  createTray();
  setupNotificationScheduler();
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("activate", () => {
  if (import_electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
