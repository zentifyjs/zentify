import { Req } from "../core/decorators/req";
import { Res } from "../core/decorators/res";
import { File } from "../core/decorators/file";
import { ZRequest, ZResponse } from "../core/types/message";
import { ZFile } from "../core/parser";
import { Body, Controller, Post } from "../core/decorators";
import { AuthMiddleware } from "./halo";

@Controller({ path: "/file" })
export class FileController {
  @Post("/upload", [new AuthMiddleware()])
  async create(
    @Res() res: ZResponse,
    @File("data") file: ZFile,
    @Body({ raw: true }) body: Record<string, any>,
  ) {
    console.log(body.name);
    await file.save(`uploads/${file.filename}`);
    res.json({ message: "File uploaded successfully", file });
  }
}
