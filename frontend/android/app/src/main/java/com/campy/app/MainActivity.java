package com.campy.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class MainActivity extends BridgeActivity {
    private static final String CHANNEL_ID = "campy_notificaciones";
    private static final int REQ_PERMISSIONS = 1001;
    private final AtomicInteger notificationId = new AtomicInteger(2000);
    private volatile String pendingOAuthUrl = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        crearCanalNotificaciones();
        solicitarPermisosApp();

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Quitar "; wv" del User-Agent para que Google OAuth permita iniciar sesión dentro del WebView del APK
            String ua = settings.getUserAgentString();
            if (ua != null) {
                String cleanUa = ua.replace("; wv", "").replace("Version/4.0 ", "");
                settings.setUserAgentString(cleanUa);
            }

            webView.addJavascriptInterface(new CampyJsBridge(this), "CampyNative");

            BridgeWebViewClient customClient = new BridgeWebViewClient(getBridge()) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    if (request != null && request.getUrl() != null) {
                        String url = request.getUrl().toString();
                        if (esRedireccionOAuthCapturable(url)) {
                            manejarUrlOAuthInterceptada(view, url);
                            return true;
                        }
                        if (esDominioOAuthInterno(url)) {
                            return false;
                        }
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url != null) {
                        if (esRedireccionOAuthCapturable(url)) {
                            manejarUrlOAuthInterceptada(view, url);
                            return true;
                        }
                        if (esDominioOAuthInterno(url)) {
                            return false;
                        }
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }

                @Override
                public void onPageStarted(WebView view, String url, Bitmap favicon) {
                    if (url != null && esRedireccionOAuthCapturable(url)) {
                        view.stopLoading();
                        manejarUrlOAuthInterceptada(view, url);
                        return;
                    }
                    super.onPageStarted(view, url, favicon);
                }

                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    if (request != null && request.getUrl() != null && request.isForMainFrame()) {
                        String url = request.getUrl().toString();
                        if (esRedireccionOAuthCapturable(url)) {
                            manejarUrlOAuthInterceptada(view, url);
                            return;
                        }
                    }
                    super.onReceivedError(view, request, error);
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    if (url != null && (url.contains("access_token=") || url.contains("code="))) {
                        pendingOAuthUrl = url;
                        view.postDelayed(() -> enviarCallbackAlWebView(url), 300);
                    } else if (pendingOAuthUrl != null && url != null && url.startsWith(obtenerAppUrlSegura())) {
                        final String oauthUrl = pendingOAuthUrl;
                        view.postDelayed(() -> enviarCallbackAlWebView(oauthUrl), 350);
                    }
                }
            };

            getBridge().setWebViewClient(customClient);
            webView.setWebViewClient(customClient);
        }

        procesarIntentOAuth(getIntent());
    }

    private String obtenerAppUrlSegura() {
        if (getBridge() != null && getBridge().getAppUrl() != null && !getBridge().getAppUrl().isEmpty()) {
            return getBridge().getAppUrl();
        }
        return "https://localhost";
    }

    private boolean esDominioOAuthInterno(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.contains("supabase.co")
            || lower.contains("accounts.google.com")
            || lower.contains("google.com/o/oauth2")
            || lower.contains("google.com/accounts")
            || lower.contains("googleusercontent.com")
            || lower.contains("gstatic.com")
            || lower.contains("github.com/login")
            || lower.contains("github.com/sessions");
    }

    private boolean esRedireccionOAuthCapturable(String url) {
        if (url == null) return false;
        if (url.startsWith("com.itoaxaca.campy://")) return true;
        String appUrl = obtenerAppUrlSegura(); // "https://localhost"
        // Si Supabase redirige a http://localhost (con o sin puerto) o https://localhost:PUERTO
        if (url.startsWith("http://localhost:") || url.startsWith("https://localhost:")) {
            return true;
        }
        if (appUrl.startsWith("https://") && url.startsWith("http://localhost")) {
            return true;
        }
        return false;
    }

    private void manejarUrlOAuthInterceptada(final WebView view, final String url) {
        pendingOAuthUrl = url;
        final String appUrl = obtenerAppUrlSegura();
        view.post(() -> {
            view.loadUrl(appUrl);
            view.postDelayed(() -> enviarCallbackAlWebView(url), 550);
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        procesarIntentOAuth(intent);
    }

    private void procesarIntentOAuth(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;
        String url = data.toString();
        if (url.startsWith("com.itoaxaca.campy://") || url.contains("access_token=") || url.contains("code=")) {
            pendingOAuthUrl = url;
            if (getBridge() != null && getBridge().getWebView() != null) {
                manejarUrlOAuthInterceptada(getBridge().getWebView(), url);
            }
        }
    }

    private void enviarCallbackAlWebView(final String url) {
        if (getBridge() == null || getBridge().getWebView() == null || url == null) return;
        final WebView webView = getBridge().getWebView();
        webView.post(() -> {
            String escaped = JSONObject.quote(url);
            String js = "if (window.recibirCallbackOAuth) { window.recibirCallbackOAuth(" + escaped + "); } " +
                        "window.dispatchEvent(new CustomEvent('campyOAuthCallback', { detail: { url: " + escaped + " } }));";
            webView.evaluateJavascript(js, null);
        });
    }

    private void crearCanalNotificaciones() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Alertas de Campy",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notificaciones de pedidos, ventas, productos y solicitudes en Campy");
            channel.enableVibration(true);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void solicitarPermisosApp() {
        List<String> permisos = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            permisos.add(Manifest.permission.CAMERA);
        }
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                permisos.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
        if (!permisos.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permisos.toArray(new String[0]),
                REQ_PERMISSIONS
            );
        }
    }

    public class CampyJsBridge {
        private final Context context;

        public CampyJsBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String obtenerUrlCallbackPendiente() {
            String url = pendingOAuthUrl;
            pendingOAuthUrl = null;
            return url != null ? url : "";
        }

        @JavascriptInterface
        public void mostrarNotificacion(String titulo, String mensaje) {
            try {
                Intent intent = new Intent(context, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);

                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(titulo != null ? titulo : "Campy")
                    .setContentText(mensaje != null ? mensaje : "")
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(mensaje != null ? mensaje : ""))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

                NotificationManager manager =
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.notify(notificationId.incrementAndGet(), builder.build());
                }
            } catch (Exception ignored) {
            }
        }
    }
}
