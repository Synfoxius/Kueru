// Minimal pass-through layout for the onboarding route group.
// Isolates onboarding from any future authenticated layout (sidebar, navbar)
// that will wrap the main app pages.
export default function OnboardingLayout({ children }) {
    return <>{children}</>;
}
