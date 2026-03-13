# Harbor Push Troubleshooting

## Issue: 401 Unauthorized when pushing to Harbor

If you're getting `401 Unauthorized` errors when pushing images to Harbor, follow these steps:

### 1. Verify Harbor Project Exists

1. Open Harbor UI: `http://192.168.68.110:80`
2. Login with admin credentials
3. Check that the `breedly` project exists in the projects list
4. If not, create it:
   - Click **+ NEW PROJECT**
   - Name: `breedly`
   - Access Level: **Private** or **Public**
   - Click **OK**

### 2. Verify Robot Account Permissions

The robot account needs **push** permissions, not just pull.

#### Option A: Project-Level Robot Account (Recommended)

1. In Harbor UI, go to the `breedly` project
2. Click **Robot Accounts** tab
3. Check if `robot$ci-puller` exists
4. If it exists, click on it and verify:
   - **Push Artifact** permission is enabled
   - **Pull Artifact** permission is enabled
5. If it doesn't exist or lacks permissions, create a new one:
   - Click **+ NEW ROBOT ACCOUNT**
   - Name: `ci-puller`
   - Expiration: Set as needed
   - Permissions: Check both **Push Artifact** and **Pull Artifact**
   - Click **ADD**
   - Copy the token (you won't see it again!)

#### Option B: System-Level Robot Account

1. In Harbor UI, click **Administration** → **Robot Accounts**
2. Find `robot$ci-puller`
3. Verify it has permissions for the `breedly` project
4. Ensure both **Push** and **Pull** are enabled

### 3. Update Credentials

If you created a new robot account or got a new token:

```bash
cd pets.frontend.dev/deploy
nano registry.env
```

Update:
```bash
REGISTRY_USERNAME=robot\$ci-puller
REGISTRY_PASSWORD=<your-new-token>
```

### 4. Test Login and Push

```bash
# Logout first
docker logout 192.168.68.110:80

# Login with new credentials
echo "<your-token>" | docker login 192.168.68.110:80 -u 'robot$ci-puller' --password-stdin

# Try pushing
./build-and-push.sh
```

### 5. Common Issues

#### Issue: "project breedly not found"
**Solution:** Create the `breedly` project in Harbor UI

#### Issue: "unauthorized to access repository"
**Solution:** Robot account needs to be a member of the project with push permissions

#### Issue: "denied: requested access to the resource is denied"
**Solution:** 
- Check robot account has push permissions
- Verify project access level (if private, robot must be a member)

#### Issue: Login succeeds but push fails with 401
**Solution:** This usually means:
- Robot account only has pull permissions (needs push too)
- Robot account is not associated with the project
- Token has expired

### 6. Alternative: Use Admin Account (Testing Only)

For testing, you can use the admin account:

```bash
docker login 192.168.68.110:80
# Enter admin username and password
```

Then try pushing again. If this works, the issue is definitely with the robot account permissions.

### 7. Check Harbor Logs

If issues persist, check Harbor logs on the server:

```bash
# On the Harbor server
docker-compose logs -f registry
```

Look for authentication or authorization errors.

## Quick Checklist

- [ ] Project `breedly` exists in Harbor
- [ ] Robot account `robot$ci-puller` exists
- [ ] Robot account has **Push Artifact** permission
- [ ] Robot account has **Pull Artifact** permission
- [ ] Robot account is associated with `breedly` project
- [ ] Token in `registry.env` is correct and not expired
- [ ] Docker is configured for insecure registry (see `INSECURE_REGISTRY_SETUP.md`)
- [ ] Can login successfully: `docker login 192.168.68.110:80`

## Need More Help?

If you've verified all the above and still have issues:

1. Try creating a new robot account with a fresh token
2. Verify Harbor is running: `curl http://192.168.68.110:80`
3. Check Harbor version supports robot accounts (v1.10+)
4. Review Harbor documentation for your specific version
