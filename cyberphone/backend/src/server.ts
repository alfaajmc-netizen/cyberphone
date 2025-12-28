@@
 import mediaRouter from "./routes/media";
+import notificationsRouter from "./routes/notifications";
@@
 app.use("/api/media", mediaRouter);
+app.use("/api/notifications", notificationsRouter);