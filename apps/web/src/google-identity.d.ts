type GoogleCredentialResponse = {
  credential: string;
  select_by: string;
};

type GoogleAccountsId = {
  initialize(options: {
    client_id: string;
    callback(response: GoogleCredentialResponse): void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: 'popup' | 'redirect';
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      locale?: string;
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      type?: 'standard' | 'icon';
      width?: number;
    },
  ): void;
};

interface Window {
  google?: { accounts: { id: GoogleAccountsId } };
}
