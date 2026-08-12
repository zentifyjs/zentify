import { Req } from "../decorators/req";
import { Res } from "../decorators/res";
import { File } from "../decorators/file";
import { ZRequest, ZResponse } from "../types/message";
import { ZFile } from "../parser";
import { Body, Controller, Post } from "../decorators";
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
