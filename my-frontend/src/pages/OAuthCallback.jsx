import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Store JWT
      localStorage.setItem("token", token);

      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      // Redirect to login on failure
      navigate("/login?error=oauth");
    }
  }, [navigate, searchParams]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Signing you in with Google...</h2>
      <p>Please wait while we complete authentication.</p>
    </div>
  );
}