import UIKit
import Capacitor

/**
 * Eigener Bildschirm-Controller nur für eine Sache: die Zurück-Wisch-Geste.
 *
 * iOS-Nutzer wischen von links, um zurückzugehen. Ohne das hier gibt es nur
 * den kleinen Pfeil oben links – der lauteste „das ist keine App"-Hinweis
 * von allen. Next.js legt seine Seitenwechsel in den Verlauf des WebViews,
 * die Geste greift also auf Detailseite → Liste.
 */
class AppViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
    }
}
