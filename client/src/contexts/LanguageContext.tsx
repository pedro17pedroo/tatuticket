import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.saas_portal': 'Portal SaaS',
    'nav.organization_portal': 'Portal das Organizações',
    'nav.customer_portal': 'Portal dos Clientes',
    'nav.logout': 'Sair',
    'nav.login': 'Entrar',
    'nav.hello': 'Olá',
    'nav.theme_light': 'Tema Claro',
    'nav.theme_dark': 'Tema Escuro',
    
    // Login
    'login.title': 'Acesso à Plataforma',
    'login.subtitle': 'Entre com suas credenciais para acessar sua área',
    'login.email': 'Email',
    'login.password': 'Senha',
    'login.submit': 'Entrar',
    'login.loading': 'Entrando...',
    'login.success': 'Login realizado com sucesso!',
    'login.error': 'Erro no login',
    'login.invalid_credentials': 'Credenciais inválidas. Tente novamente.',
    'login.access_denied': 'Acesso negado',
    'login.back_home': 'Voltar ao Início',
    'login.demo_accounts': 'Contas de Demonstração:',
    'login.security_notice': 'Suas credenciais são seguras. Você será redirecionado automaticamente para o portal apropriado.',
    
    // Welcome messages
    'welcome.admin_portal': 'Portal de Administração',
    'welcome.organization_portal': 'Portal das Organizações',
    'welcome.customer_portal': 'Portal dos Clientes',
    'welcome.saas_portal': 'Portal TatuTicket',
    
    // Common
    'common.welcome': 'Bem-vindo ao',
    'common.language': 'Idioma',
    'common.theme': 'Tema',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.saas_portal': 'SaaS Portal',
    'nav.organization_portal': 'Organizations Portal',
    'nav.customer_portal': 'Customers Portal',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.hello': 'Hello',
    'nav.theme_light': 'Light Theme',
    'nav.theme_dark': 'Dark Theme',
    
    // Login
    'login.title': 'Platform Access',
    'login.subtitle': 'Enter your credentials to access your area',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Login',
    'login.loading': 'Logging in...',
    'login.success': 'Login successful!',
    'login.error': 'Login error',
    'login.invalid_credentials': 'Invalid credentials. Please try again.',
    'login.access_denied': 'Access denied',
    'login.back_home': 'Back to Home',
    'login.demo_accounts': 'Demo Accounts:',
    'login.security_notice': 'Your credentials are secure. You will be automatically redirected to the appropriate portal.',
    
    // Welcome messages
    'welcome.admin_portal': 'Administration Portal',
    'welcome.organization_portal': 'Organizations Portal',
    'welcome.customer_portal': 'Customers Portal',
    'welcome.saas_portal': 'TatuTicket Portal',
    
    // Common
    'common.welcome': 'Welcome to',
    'common.language': 'Language',
    'common.theme': 'Theme',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.saas_portal': 'Portal SaaS',
    'nav.organization_portal': 'Portal de Organizaciones',
    'nav.customer_portal': 'Portal de Clientes',
    'nav.logout': 'Salir',
    'nav.login': 'Iniciar Sesión',
    'nav.hello': 'Hola',
    'nav.theme_light': 'Tema Claro',
    'nav.theme_dark': 'Tema Oscuro',
    
    // Login
    'login.title': 'Acceso a la Plataforma',
    'login.subtitle': 'Ingrese sus credenciales para acceder a su área',
    'login.email': 'Correo',
    'login.password': 'Contraseña',
    'login.submit': 'Ingresar',
    'login.loading': 'Iniciando sesión...',
    'login.success': '¡Inicio de sesión exitoso!',
    'login.error': 'Error de inicio de sesión',
    'login.invalid_credentials': 'Credenciales inválidas. Inténtelo de nuevo.',
    'login.access_denied': 'Acceso denegado',
    'login.back_home': 'Volver al Inicio',
    'login.demo_accounts': 'Cuentas de Demostración:',
    'login.security_notice': 'Sus credenciales están seguras. Será redirigido automáticamente al portal apropiado.',
    
    // Welcome messages
    'welcome.admin_portal': 'Portal de Administración',
    'welcome.organization_portal': 'Portal de Organizaciones',
    'welcome.customer_portal': 'Portal de Clientes',
    'welcome.saas_portal': 'Portal TatuTicket',
    
    // Common
    'common.welcome': 'Bienvenido al',
    'common.language': 'Idioma',
    'common.theme': 'Tema',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('tatuticket_language') as Language;
    if (savedLanguage && ['pt', 'en', 'es'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('tatuticket_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}