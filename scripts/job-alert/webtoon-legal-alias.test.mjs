import { describe, expect, it } from 'vitest';
import { buildPending } from './pipeline.mjs';
const now = new Date('2026-11-23T22:00:00+09:00');
const sent = { companyName:'네이버웹툰', title:'[2027 상반기 채용연계형 인턴십] 네이버웹툰 백엔드 서버 개발 (Backend Software Development)', sourceUrl:'https://linkareer.com/activity/364883', deadlineAt:'2026-12-06T23:59:00+09:00', rolling:false };
const mirror = {...sent, companyName:'네이버웹툰(유)', sourceUrl:'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=55617458'};
const pending=(jobs,sentJobs=[])=>buildPending({collectors:[{jobs}],sentJobs,now});
describe('webtoon legal company alias',()=>{
 it('removes the duplicate of an already sent campaign',()=>expect(pending([mirror],[sent]).jobs).toHaveLength(0));
 it('deduplicates the alias in both source orders',()=>{expect(pending([sent,mirror]).jobs).toHaveLength(1);expect(pending([mirror,sent]).jobs).toHaveLength(1)});
 it('retains a different deadline',()=>expect(pending([{...mirror,deadlineAt:'2026-12-07T23:59:00+09:00'}],[sent]).jobs).toHaveLength(1));
 it('retains different employers',()=>expect(pending([{...mirror,companyName:'다른웹툰(유)'}],[sent]).jobs).toHaveLength(1));
 it('retains a different specific role',()=>expect(pending([{...mirror,title:'[2027 상반기 채용연계형 인턴십] 네이버웹툰 프론트엔드 개발'}],[sent]).jobs).toHaveLength(1));
});
