import { defineMessages } from '../../i18n/messages.ts';

export const authMessages = defineMessages({
  de: {
    login: {
      title: 'Anmelden',
      intro: 'Interne Konten werden über den Admin-Befehl eingerichtet.',
      email: 'E-Mail',
      password: 'Passwort',
      submit: 'Anmelden',
      checking: 'Wird geprüft …',
      unavailable: 'Anmeldung derzeit nicht möglich. Bitte später erneut versuchen.',
    },
    join: {
      checking: 'Einladung wird geprüft …',
      invalidTitle: 'Einladung ungültig',
      invalidDetail:
        'Dieser Link ist abgelaufen, wurde bereits verwendet oder existiert nicht. Bitten Sie um eine neue Einladung.',
      title: (workspace: string) => `Beitreten zu ${workspace}`,
      invitedAs: (email: string, role: string) => `Einladung für ${email} als ${role}.`,
      accountExists:
        'Zu dieser E-Mail gibt es bereits ein Konto. Melden Sie sich zuerst damit an und öffnen Sie den Link erneut.',
      name: 'Ihr Name',
      password: 'Passwort',
      passwordHint: 'Mindestens 12 Zeichen',
      submit: 'Einladung annehmen',
      accepting: 'Wird angenommen …',
      failed: 'Die Einladung konnte nicht angenommen werden.',
    },
    password: {
      title: 'Passwort ändern',
      current: 'Bisheriges Passwort',
      next: 'Neues Passwort',
      nextHint: 'Mindestens 12 Zeichen',
      submit: 'Passwort ändern',
      saving: 'Wird geändert …',
      done: 'Passwort geändert. Auf anderen Geräten ist das Konto jetzt abgemeldet.',
      failed: 'Das Passwort konnte nicht geändert werden. Bitte später erneut versuchen.',
      demo: 'In der Demo lässt sich das Passwort nicht ändern. Die Konten hier gibt es nur für eine Stunde.',
    },
  },
  en: {
    login: {
      title: 'Sign in',
      intro: 'Internal accounts are set up with the admin command.',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      checking: 'Checking …',
      unavailable: 'Signing in is not possible right now. Please try again later.',
    },
    join: {
      checking: 'Checking the invitation …',
      invalidTitle: 'Invitation not valid',
      invalidDetail:
        'This link has expired, has already been used or does not exist. Please ask for a new invitation.',
      title: (workspace: string) => `Join ${workspace}`,
      invitedAs: (email: string, role: string) => `Invitation for ${email} as ${role}.`,
      accountExists:
        'An account already exists for this email. Sign in with it first, then open the link again.',
      name: 'Your name',
      password: 'Password',
      passwordHint: 'At least 12 characters',
      submit: 'Accept invitation',
      accepting: 'Accepting …',
      failed: 'The invitation could not be accepted.',
    },
    password: {
      title: 'Change password',
      current: 'Current password',
      next: 'New password',
      nextHint: 'At least 12 characters',
      submit: 'Change password',
      saving: 'Changing …',
      done: 'Password changed. The account is now signed out on other devices.',
      failed: 'The password could not be changed. Please try again later.',
      demo: 'The password cannot be changed in the demo. The accounts here only exist for an hour.',
    },
  },
});
