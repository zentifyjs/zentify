import { ZRequest, ZResponse } from "../types/message";
import { Purpose, ZentifyResponsePayload } from "../types";
import { ZentifyAdapter } from "../types/adapter";
import { ZentifyViewEngine } from "../view";
import { HttpException } from "../exception/http";
import { Logger } from "../utils";

export class ResponseHandler {
  private logger = new Logger({ context: "ResponseHandler" });
  private adapters: ZentifyAdapter[] = [];

  private responseHandlers: Record<string, (payload: any, req: ZRequest, res: ZResponse) => Promise<void> | void> = {
    [Purpose.view]: (payload, req, res) => this.handleViewResponse(payload, req, res),
    [Purpose.redirect]: (payload, req, res) => this.handleRedirectResponse(payload, req, res),
    [Purpose.json]: (payload, req, res) => this.handleJsonResponse(payload, res),
  };

  constructor(adapters: ZentifyAdapter[] = []) {
    this.adapters = adapters;
  }

  public async handleResponse(result: unknown, req: ZRequest, res: ZResponse) {
    if (result !== undefined && !res.writableEnded) {
      if (typeof result === "object" && result !== null && "__isZentifyResponse" in result) {
        const response = result as ZentifyResponsePayload;
        
        const handler = this.responseHandlers[response.purpose];
        if (handler) {
          await handler(response.payload, req, res);
        } else {
          this.handleJsonResponse(response.payload, res);
        }
      } else {
        this.sendJsonResponse(res, 200, result);
      }
    }
  }

  public handleException(error: unknown, res: ZResponse): void {
    if (res.writableEnded) return;
    
    if (error instanceof HttpException) {
      this.sendJsonResponse(res, error.statusCode, {
        message: error.message,
        details: error.details,
      });
      return;
    }
    
    this.logger.error("Server error:", error);
    this.sendJsonResponse(res, 500, { message: "Internal Server Error" });
  }

  public sendJsonResponse(res: ZResponse, statusCode: number, data: unknown): void {
    if (res.writableEnded) return;
    res.statusCode = statusCode;
    res.json(data);
  }

  private async handleViewResponse(payload: any, req: ZRequest, res: ZResponse) {
    let viewEngine: ZentifyViewEngine | undefined;
    for (const adapter of this.adapters) {
      if (adapter.getViewEngine) {
        viewEngine = adapter.getViewEngine();
        if (viewEngine) break;
      }
    }

    if (!viewEngine) {
      throw new Error("View Engine is not configured but a view was returned.");
    }
    await viewEngine.render(payload.page, payload.props, req, res);
  }

  private async handleRedirectResponse(payload: any, req: ZRequest, res: ZResponse) {
    res.writeHead(payload.status, { Location: payload.url });
    res.end();
  }

  private handleJsonResponse(payload: any, res: ZResponse) {
    this.sendJsonResponse(res, 200, payload);
  }
}
