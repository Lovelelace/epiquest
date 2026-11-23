import { healthResponseSchema, type HealthResponse } from "@epiquest/schemas";
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check(): HealthResponse {
    return healthResponseSchema.parse({ status: "ok" });
  }
}
