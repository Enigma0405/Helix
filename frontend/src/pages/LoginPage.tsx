import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useLogin } from "@/features/auth/api/useAuth";
import { useNavigate } from "react-router-dom";
import { Shield, Sparkles, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

const loginSchema = zod.object({
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

type LoginFields = zod.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const navigate = useNavigate();
  const loginMutation = useLogin();

  const onSubmit = (data: LoginFields) => {
    loginMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          navigate("/");
        },
      }
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0F172A] p-4 overflow-hidden">
      {/* Dynamic background glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl shadow-2xl relative z-10">
        <CardHeader className="text-center pt-8 pb-6">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 shadow-lg shadow-violet-950/20 text-white">
              <Shield size={24} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-violet-400 bg-clip-text text-transparent">
            PROJECT HELIX
          </h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
            EvidenceOps Platform
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="demo@helix.ai"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-semibold transition-all mt-6 shadow-md shadow-violet-950/20"
              loading={loginMutation.isPending}
            >
              Log In to Workspace
            </Button>
          </form>

          {loginMutation.isError && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
              {(loginMutation.error as any)?.message || "Invalid email or password."}
            </div>
          )}

          {/* AMD story badge */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            <Cpu size={12} className="text-violet-500" />
            <span>AMD-Optimized AI Runtime</span>
            <Sparkles size={10} className="text-amber-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
