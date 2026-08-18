import { LogOut, ShieldCheck } from 'lucide-react';
import { useEmployeeAuth } from '@/app/EmployeeAuthContext';
import { useTenant } from '@/app/TenantContext';

export function ProfilePage() {
  const { user, signOut } = useEmployeeAuth();
  const { organization } = useTenant();

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-2xl">
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">YOUR ACCOUNT</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-1">Profile</h1>
      </header>

      <section className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex items-center gap-4">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4F6B57] text-lg font-semibold text-white">
            {user?.name ? user.name.slice(0, 1) : 'Y'}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-[#233226]">{user?.name ?? 'You'}</p>
          <p className="text-xs text-[#78897B]">{user?.email}</p>
          <p className="mt-1 text-[11px] text-[#9AA79C]">Signed in with Google</p>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-3">
        <h2 className="font-serif text-xl font-normal text-[#233226] flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-[#4F6B57]" />
          What {organization.name} can and can't see
        </h2>
        <ul className="flex flex-col gap-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
          <li>✓ That you're an active member of the platform, counted only in aggregate.</li>
          <li>✓ How many assessments and sessions were used across the whole company.</li>
          <li>✕ Never your name against a specific assessment, score, or conversation.</li>
          <li>✕ Never what you said to Tara, and never a transcript of it.</li>
          <li>✕ Never which sessions you booked, or why.</li>
        </ul>
      </section>

      <button
        type="button"
        onClick={() => void signOut()}
        className="inline-flex items-center gap-2 self-start rounded-full border border-[#D9D2C5] bg-white hover:bg-[#F3EFE8] text-[#233226] px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
