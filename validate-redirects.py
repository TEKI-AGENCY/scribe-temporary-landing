import csv
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE_URL = "https://www.scribe.com.co"
CSV_PATH = Path("seo/Scribe_Redirecciones_Emergencia.csv")
OUTPUT_PATH = Path("redirect-validation.csv")

MAX_WORKERS = 12
TIMEOUT = 10


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


NO_REDIRECT_OPENER = urllib.request.build_opener(NoRedirect)


def normalize_url(value: str) -> str:
    value = value.strip()

    if value.startswith("http://") or value.startswith("https://"):
        return value

    if not value.startswith("/"):
        value = f"/{value}"

    return f"{BASE_URL}{value}"


def request_without_redirect(url: str):
    try:
        request = urllib.request.Request(
            url,
            method="HEAD",
            headers={"User-Agent": "Scribe-Redirect-Validator/1.0"},
        )

        response = NO_REDIRECT_OPENER.open(
            request,
            timeout=TIMEOUT,
        )

        return response.status, response.headers.get("Location")

    except urllib.error.HTTPError as error:
        return error.code, error.headers.get("Location")

    except Exception as error:
        return None, str(error)


def request_following_redirects(url: str):
    try:
        request = urllib.request.Request(
            url,
            method="HEAD",
            headers={"User-Agent": "Scribe-Redirect-Validator/1.0"},
        )

        response = urllib.request.urlopen(
            request,
            timeout=TIMEOUT,
        )

        return response.status, response.geturl()

    except urllib.error.HTTPError as error:
        return error.code, error.geturl()

    except Exception as error:
        return None, str(error)


def validate(row):
    origin = normalize_url(row["origen"])
    expected_destination = normalize_url(row["destino"])
    expected_code = int(row.get("codigo", "301"))

    actual_code, actual_location = request_without_redirect(origin)

    final_code, final_url = request_following_redirects(origin)

    status_ok = actual_code == expected_code
    location_ok = actual_location == expected_destination
    final_ok = final_code == 200

    return {
        "origin": origin,
        "expected_code": expected_code,
        "actual_code": actual_code,
        "expected_destination": expected_destination,
        "actual_location": actual_location,
        "final_code": final_code,
        "final_url": final_url,
        "status_ok": status_ok,
        "location_ok": location_ok,
        "final_ok": final_ok,
        "result": "OK" if status_ok and location_ok and final_ok else "ERROR",
    }


def main():
    print("SCRIBE REDIRECT VALIDATION", flush=True)
    print("=" * 70, flush=True)

    if not CSV_PATH.exists():
        print(
            f"ERROR: No encuentro el CSV en: {CSV_PATH.resolve()}",
            flush=True,
        )
        sys.exit(1)

    with CSV_PATH.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        rows = list(csv.DictReader(file))

    print(f"CSV encontrado: {CSV_PATH}", flush=True)
    print(f"URLs a validar: {len(rows)}", flush=True)
    print(f"Workers: {MAX_WORKERS}", flush=True)
    print(flush=True)

    results = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(validate, row): row
            for row in rows
        }

        completed = 0

        for future in as_completed(futures):
            completed += 1

            try:
                result = future.result()
            except Exception as error:
                row = futures[future]

                result = {
                    "origin": row.get("origen"),
                    "expected_code": row.get("codigo"),
                    "actual_code": None,
                    "expected_destination": row.get("destino"),
                    "actual_location": None,
                    "final_code": None,
                    "final_url": None,
                    "status_ok": False,
                    "location_ok": False,
                    "final_ok": False,
                    "result": f"ERROR: {error}",
                }

            results.append(result)

            marker = "✓" if result["result"] == "OK" else "✗"

            print(
                f"[{completed:03}/{len(rows)}] "
                f"{marker} "
                f"{result['origin']}",
                flush=True,
            )

    results.sort(key=lambda item: item["origin"])

    with OUTPUT_PATH.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as file:
        fieldnames = [
            "origin",
            "expected_code",
            "actual_code",
            "expected_destination",
            "actual_location",
            "final_code",
            "final_url",
            "status_ok",
            "location_ok",
            "final_ok",
            "result",
        ]

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(results)

    passed = sum(
        1 for result in results
        if result["result"] == "OK"
    )

    failed = len(results) - passed

    print()
    print("=" * 70)
    print("RESULTADOS")
    print("=" * 70)
    print(f"Total:  {len(results)}")
    print(f"OK:     {passed}")
    print(f"ERROR:  {failed}")
    print()
    print(f"Reporte generado: {OUTPUT_PATH.resolve()}")

    if failed:
        print()
        print("REDIRECCIONES CON ERROR")
        print("-" * 70)

        for result in results:
            if result["result"] == "OK":
                continue

            print()
            print(result["origin"])
            print(
                f"  Esperado: "
                f"{result['expected_code']} "
                f"→ {result['expected_destination']}"
            )
            print(
                f"  Recibido: "
                f"{result['actual_code']} "
                f"→ {result['actual_location']}"
            )
            print(
                f"  Final: "
                f"{result['final_code']} "
                f"→ {result['final_url']}"
            )

        sys.exit(1)


if __name__ == "__main__":
    main()