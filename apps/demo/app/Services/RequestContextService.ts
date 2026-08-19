import {
  Dependency,
  Inject,
  REQUEST_CONTEXT,
  ZentifyHttpContextService,
} from "@zentify/core";

@Dependency()
export class RequestContextService {
  constructor(
    @Inject(REQUEST_CONTEXT)
    private readonly ctx: ZentifyHttpContextService,
  ) {}

  describe() {
    const { req } = this.ctx.current();
    return {
      method: req.method,
      url: req.url,
      hasBody: req.body !== undefined,
    };
  }
}
