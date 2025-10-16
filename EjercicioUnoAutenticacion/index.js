//TOKEN
const AuthService = {
    // Usuarios válidos de prueba
    validUsers: {
        'admin@app.com': { password: 'admin123', role: 'admin', name: 'Administrador' },
        'user@app.com': { password: 'user123', role: 'user', name: 'Usuario' }
    },

    // Generar JWT simulado
    generateToken(email, role) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            email,
            role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (2 * 60) // 2 minutos
        }));
        const signature = btoa('simulated-signature');
        return `${header}.${payload}.${signature}`;
    },

    // Validar token
    validateToken(token) {
        if (!token) return null;
        
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);

            if (payload.exp < now) {
                return null;
            }

            return payload;
        } catch (e) {
            return null;
        }
    },

    // Obtener token del localStorage
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Guardar token
    setToken(token) {
        localStorage.setItem('authToken', token);
    },

    // Eliminar token
    removeToken() {
        localStorage.removeItem('authToken');
    },

    // Verificar autenticación
    isAuthenticated() {
        const token = this.getToken();
        return this.validateToken(token) !== null;
    },

    // Obtener datos del usuario desde el token
    getUser() {
        const token = this.getToken();
        const payload = this.validateToken(token);
        if (payload) {
            const user = this.validUsers[payload.email];
            return {
                email: payload.email,
                role: payload.role,
                name: user?.name || 'Usuario',
                expiresAt: payload.exp
            };
        }
        return null;
    }
};

// SUBMIT
function login(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validar credenciales
    if (!AuthService.validUsers[email]) {
        showAlert('error', '❌ Usuario no encontrado');
        return;
    }

    if (AuthService.validUsers[email].password !== password) {
        showAlert('error', '❌ Contraseña incorrecta');
        return;
    }

    // Generar y guardar token
    const user = AuthService.validUsers[email];
    const token = AuthService.generateToken(email, user.role);
    AuthService.setToken(token);

    showAlert('success', `✅ ¡Bienvenido ${user.name}!`);
    document.getElementById('loginForm').reset();
}

function logout() {
    AuthService.removeToken();
    updateNavbar();
}


// Funciones de UI
function showAlert(type, message) {
    const alertTypes = {
        'error': { id: 'errorAlert', messageId: 'errorMessage' },
        'warning': { id: 'warningAlert', messageId: 'warningMessage' },
        'success': { id: 'successAlert', messageId: 'successMessage' }
    };

    // Ocultar todas las alertas primero
    Object.values(alertTypes).forEach(config => {
        const el = document.getElementById(config.id);
        if (el) el.classList.add('d-none');
    });

    const config = alertTypes[type];
    if (config) {
        const alertEl = document.getElementById(config.id);
        const messageEl = document.getElementById(config.messageId);
        
        if (alertEl && messageEl) {
            messageEl.textContent = message;
            alertEl.classList.remove('d-none');
            
            setTimeout(() => {
                alertEl.classList.add('d-none');
            }, 5000);
        }
    }
}