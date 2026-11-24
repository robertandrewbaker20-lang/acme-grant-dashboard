import { ExternalLink, Globe, Mail, Phone, User } from "lucide-react";
import type { FoundationContact } from "@/lib/family-foundations";

export function FoundationContactSection({
  contact,
  website,
  generalEmail,
  generalPhone,
}: {
  contact?: FoundationContact;
  website?: string;
  generalEmail?: string;
  generalPhone?: string;
}) {
  const email = contact?.email ?? generalEmail;
  const phone = contact?.phone ?? generalPhone;
  const site = contact?.url ?? website;
  const hasNamedContact = contact?.name && contact.name !== "Program team";

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <User className="h-3 w-3" />
        Foundation contact
      </div>

      {hasNamedContact ? (
        <>
          <p className="mt-1 text-sm font-semibold text-slate-900">{contact!.name}</p>
          {contact?.title && (
            <p className="text-xs text-slate-600">{contact.title}</p>
          )}
        </>
      ) : contact?.name ? (
        <p className="mt-1 text-sm font-medium text-slate-800">{contact.name}</p>
      ) : (
        <p className="mt-1 text-sm text-slate-600">
          No named program officer — use foundation website or general inquiry channels.
        </p>
      )}

      <div className="mt-2 flex flex-col gap-1.5 text-xs">
        {site && (
          <a
            href={site}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-teal-700 hover:underline"
          >
            <Globe className="h-3 w-3 shrink-0" />
            {site.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-teal-700"
          >
            <Mail className="h-3 w-3 shrink-0" />
            {email}
          </a>
        )}
        {phone && (
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <Phone className="h-3 w-3 shrink-0" />
            {phone}
          </span>
        )}
      </div>
    </div>
  );
}
