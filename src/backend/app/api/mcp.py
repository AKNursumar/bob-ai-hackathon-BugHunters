"""
PortPulse Backend — MCP HTTP Wrapper

Exposes MCP tools via HTTP endpoints for IBM Bob integration.

Endpoints:
  GET  /mcp/tools               — List all available tools with schemas
  POST /mcp/tools/{tool_name}   — Call a tool with arguments
  GET  /mcp/resources           — List available port resources (for Bob discovery)
  GET  /mcp/status              — Server health and tool count
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Optional

from app.services.mcp_server import get_mcp_server
from app.core.logging_config import get_logger

logger = get_logger("api.mcp")
router = APIRouter()


# ---------------------------------------------------------------------------
# Request model — typed body so FastAPI validates and generates correct OpenAPI
# ---------------------------------------------------------------------------

class MCPToolCallRequest(BaseModel):
    """Request body for calling an MCP tool."""
    arguments: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Lazy accessor — avoids running at import time before init_db()
# ---------------------------------------------------------------------------

def _mcp():
    return get_mcp_server()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/mcp/tools")
def list_mcp_tools():
    """Return all available MCP tools with their input schemas."""
    return {"tools": _mcp().get_tools()}


@router.post("/mcp/tools/{tool_name}")
async def call_mcp_tool(tool_name: str, request: MCPToolCallRequest):
    """
    Call an MCP tool by name.

    Request body::

        { "arguments": { "port_id": "lalb" } }

    Returns ``{"success": true, ...}`` on success.
    Returns ``404`` if the tool name is unknown.
    Returns ``500`` if the tool raises an unexpected error.
    """
    logger.info(f"MCP tool call: {tool_name} — args: {list(request.arguments.keys())}")

    server = _mcp()

    if tool_name not in server.tools:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown MCP tool '{tool_name}'. "
                   f"Available tools: {sorted(server.tools.keys())}",
        )

    try:
        result = await server.call_tool(tool_name, request.arguments)
        # Surface tool-level errors as HTTP 500 so callers can distinguish them
        # from a successful call that returned {"success": false}
        if isinstance(result, dict) and result.get("success") is False:
            error_msg = result.get("error", "Tool returned an error")
            logger.warning(f"MCP tool '{tool_name}' returned error: {error_msg}")
            # Return the tool error as-is with 200 so Bob can read the message;
            # only raise 500 for unexpected/unhandled exceptions (caught below).
        return result

    except KeyError:
        # Should not happen after the guard above, but be safe
        raise HTTPException(status_code=404, detail=f"Unknown MCP tool '{tool_name}'")
    except Exception as e:
        logger.error(f"MCP tool '{tool_name}' unhandled error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mcp/resources")
def list_mcp_resources():
    """
    List available MCP resources (port data that Bob can read directly).

    Resources follow the standard MCP resource envelope so Bob can
    discover what data is accessible without calling a tool.
    """
    from app.services.mcp_server import _get_db_factory
    from app.services.port_service import PortService

    db = _get_db_factory()()
    try:
        service = PortService(db)
        ports = service.list_ports()
        resources = [
            {
                "uri": f"portpulse://ports/{p.id}",
                "name": p.name,
                "description": f"Live operational data for {p.name} ({p.id})",
                "mimeType": "application/json",
            }
            for p in ports
        ]
        return {"resources": resources}
    except Exception as e:
        logger.error(f"list_mcp_resources error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/mcp/status")
def mcp_status():
    """MCP server health — returns tool count and version."""
    server = _mcp()
    return {
        "status": "ok",
        "tools_available": len(server.tools),
        "tool_names": sorted(server.tools.keys()),
        "version": "1.0.0",
    }
