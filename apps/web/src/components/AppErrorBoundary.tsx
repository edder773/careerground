import { Component, type ErrorInfo, type PropsWithChildren } from 'react';

type State = { error?: Error };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Rendering failures contain no user content in logs. Runtime monitoring can hook in here later.
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="fatal-error" role="alert">
        <h1>이 화면을 표시하지 못했습니다</h1>
        <p>작성 중인 내용이 있다면 복사한 뒤 화면을 새로고침해주세요.</p>
        <button type="button" onClick={() => window.location.reload()}>
          화면 새로고침
        </button>
      </section>
    );
  }
}
