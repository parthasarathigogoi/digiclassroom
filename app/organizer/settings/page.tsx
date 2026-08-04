"use client";

import React, { useState } from "react";
import { Bell, ImagePlus, Loader2, LockKeyhole, Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const OrganizerSettingsPage: React.FC = () => {
  const { user, updateOrganizationSettings, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.institution || "",
    logoUrl: "",
    description: "",
    address: "",
    contactEmail: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    academicYear: "2026-2027",
    themeColor: "#2563eb",
    emailNotifications: true,
    smsNotifications: false,
    twoFactorRequired: false
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({ ...current, logoUrl: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await updateOrganizationSettings(formData);
      toast.success("Organization settings updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update settings.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Organization Settings</p>
          <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">Manage Your Organization</h1>
          <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-400">Configure branding, contact details, notifications, and security without any Admin approval step.</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          Self-service workspace
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-black text-ink dark:text-white">Organization Profile</h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Organization Name</label>
              <input
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Logo Upload</label>
              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900">
                <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white text-ocean shadow-sm dark:bg-slate-900">
                  {formData.logoUrl ? <img src={formData.logoUrl} alt="Organization logo preview" className="h-full w-full object-cover" /> : <ImagePlus size={24} />}
                </div>
                <div>
                  <p className="font-bold text-ink dark:text-white">Upload organization logo</p>
                  <p className="text-sm text-slate-500">PNG, JPG, or SVG preview for your workspace branding.</p>
                </div>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="sr-only" />
              </label>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Organization Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Briefly describe your institution."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Address</label>
              <input
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Campus address"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(event) => setFormData({ ...formData, contactEmail: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
              <input
                value={formData.phoneNumber}
                onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Academic Year</label>
              <input
                value={formData.academicYear}
                onChange={(event) => setFormData({ ...formData, academicYear: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Theme Color / Branding</label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <Palette size={18} className="text-slate-400" />
                <input
                  type="color"
                  value={formData.themeColor}
                  onChange={(event) => setFormData({ ...formData, themeColor: event.target.value })}
                  className="h-8 w-12 cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-sm font-bold uppercase text-slate-500">{formData.themeColor}</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Bell className="text-ocean" size={22} />
              <h2 className="text-xl font-black text-ink dark:text-white">Notification Preferences</h2>
            </div>
            <div className="mt-5 space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <span className="font-bold text-slate-700 dark:text-slate-300">Email notifications</span>
                <input type="checkbox" checked={formData.emailNotifications} onChange={(event) => setFormData({ ...formData, emailNotifications: event.target.checked })} className="h-5 w-5 rounded text-blue-600" />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <span className="font-bold text-slate-700 dark:text-slate-300">SMS notifications</span>
                <input type="checkbox" checked={formData.smsNotifications} onChange={(event) => setFormData({ ...formData, smsNotifications: event.target.checked })} className="h-5 w-5 rounded text-blue-600" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <LockKeyhole className="text-ocean" size={22} />
              <h2 className="text-xl font-black text-ink dark:text-white">Security Settings</h2>
            </div>
            <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <span className="font-bold text-slate-700 dark:text-slate-300">Require two-factor authentication</span>
              <input type="checkbox" checked={formData.twoFactorRequired} onChange={(event) => setFormData({ ...formData, twoFactorRequired: event.target.checked })} className="h-5 w-5 rounded text-blue-600" />
            </label>
          </section>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Organization Settings
          </button>
        </aside>
      </form>
    </div>
  );
};

export default OrganizerSettingsPage;
