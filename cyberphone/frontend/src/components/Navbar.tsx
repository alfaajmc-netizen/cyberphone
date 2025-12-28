@@
 import { useAuth } from "../store/useAuth";
+import NotificationBell from "./NotificationBell";
@@
         <div>
           {user ? (
             <div className="flex items-center space-x-3">
+              <NotificationBell />
               <span className="text-sm text-gray-700">Olá, {user.username}</span>
               <button
                 onClick={() => logout()}
                 className="px-3 py-1 bg-red-500 text-white rounded text-sm"
               >
                 Sair
               </button>
             </div>
           ) : (